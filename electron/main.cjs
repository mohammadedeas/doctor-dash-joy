const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");

// ── Lock userData to a stable path regardless of package name ────────
// Must be called BEFORE app.whenReady()
app.setPath("userData", path.join(app.getPath("appData"), "Clinic OS"));

// Set up debug logging
const logPath = path.join(app.getPath("userData"), "debug.log");
// Rotate log if > 2MB
try {
  if (fs.existsSync(logPath) && fs.statSync(logPath).size > 2 * 1024 * 1024) {
    fs.renameSync(logPath, logPath + ".old");
  }
} catch {}
function logToFile(msg) {
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    console.log(msg);
  } catch (e) {}
}

let mainWindow = null;
let serverProcess = null;
const isDev = !app.isPackaged;

// ── Find a free port ──────────────────────────────────────────────────
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

// ── Wait for server to be ready — fails fast if process exits ────────
function waitForServer(port, serverProc, retries = 40) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    let settled = false;

    // Fast-fail: if the child process exits before server is ready, reject immediately
    if (serverProc) {
      serverProc.once("exit", (code) => {
        if (!settled) {
          settled = true;
          reject(new Error(`Server process exited with code ${code} before becoming ready`));
        }
      });
    }

    const check = () => {
      if (settled) return;
      const req = require("http").get(`http://localhost:${port}/api/health`, (res) => {
        if (settled) return;
        if (res.statusCode === 200) {
          settled = true;
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", retry);
      req.setTimeout(500, () => { req.destroy(); retry(); });
    };

    const retry = () => {
      if (settled) return;
      attempts++;
      if (attempts >= retries) {
        settled = true;
        reject(new Error("Server did not respond after 20 seconds. Check debug.log for details."));
        return;
      }
      setTimeout(check, 500);
    };

    check();
  });
}

// ── Show error dialog with Retry / Quit ──────────────────────────────
async function showStartupError(err) {
  logToFile(`[electron] Startup error: ${err.message}`);
  const { response } = await dialog.showMessageBox({
    type: "error",
    title: "Clinic OS — Startup Failed",
    message: "The application server failed to start.",
    detail: `${err.message}\n\nLog file: ${logPath}`,
    buttons: ["Retry", "Quit"],
    defaultId: 0,
    cancelId: 1,
  });
  return response === 0; // true = retry
}

async function startServer() {
  if (isDev) {
    logToFile("[electron] Dev mode: waiting for server on port 3001...");
    await waitForServer(3001, null);
    return 3001;
  }

  // ── Production mode ───────────────────────────────────────────────
  const port = await getFreePort();
  const dbDir = app.getPath("userData");
  const appRoot = path.join(process.resourcesPath, "app.asar.unpacked");
  const staticDir = path.join(appRoot, "dist", "client");
  const serverEntry = path.join(appRoot, "server", "dist", "index.cjs");

  logToFile(`[electron] userData: ${dbDir}`);
  logToFile(`[electron] staticDir: ${staticDir}`);
  logToFile(`[electron] serverEntry: ${serverEntry}`);
  logToFile(`[electron] port: ${port}`);

  // Verify server entry exists before spawning
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Server bundle not found at:\n${serverEntry}`);
  }

  serverProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      PORT: String(port),
      DB_DIR: dbDir,
      STATIC_DIR: staticDir,
      ELECTRON_RUN_AS_NODE: "1",
    },
    cwd: appRoot,
    stdio: "pipe",
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (d) => logToFile(`[server] ${d.toString().trim()}`));
  serverProcess.stderr.on("data", (d) => logToFile(`[server ERR] ${d.toString().trim()}`));
  serverProcess.on("close", (code) => logToFile(`[server] exited with code ${code}`));
  serverProcess.on("error", (e) => logToFile(`[server process error] ${e.message}`));

  await waitForServer(port, serverProcess);
  logToFile(`[electron] Server ready on port ${port}`);
  return port;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: `Clinic OS v${app.getVersion()}`,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev, // disable DevTools access in production
    },
    show: false,
    backgroundColor: "#f7faf9",
  });

  mainWindow.setMenuBarVisibility(false);

  // Block F12 / Ctrl+Shift+I in production
  if (!isDev) {
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (
        input.key === "F12" ||
        (input.control && input.shift && input.key === "I") ||
        (input.control && input.shift && input.key === "J") ||
        (input.control && input.key === "U")
      ) {
        event.preventDefault();
      }
    });
  }

  if (isDev) {
    const devUrl = process.env.VITE_DEV_URL || "http://localhost:8080";
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadURL(`http://localhost:${port}`);
  }

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}

// ── IPC: expose app version to renderer ──────────────────────────────
ipcMain.handle("app:version", () => app.getVersion());

// ── Boot sequence with retry loop ─────────────────────────────────────
async function boot() {
  while (true) {
    try {
      const port = await startServer();
      createWindow(port);
      break;
    } catch (err) {
      const retry = await showStartupError(err);
      if (!retry) {
        app.quit();
        break;
      }
      // Kill any lingering server process before retrying
      if (serverProcess) {
        try { serverProcess.kill(); } catch {}
        serverProcess = null;
      }
    }
  }
}

app.whenReady().then(boot);

app.on("window-all-closed", () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch {}
    serverProcess = null;
  }
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch {}
    serverProcess = null;
  }
});

app.on("activate", () => {
  if (mainWindow === null) boot();
});
