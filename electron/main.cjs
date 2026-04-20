const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

let mainWindow = null;
let serverProcess = null;
const isDev = !app.isPackaged;

// Find a free port
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

// Wait for server to be ready
function waitForServer(port, retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = require("http").get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on("error", retry);
      req.setTimeout(500, retry);
    };
    const retry = () => {
      attempts++;
      if (attempts >= retries) {
        reject(new Error("Server did not start in time"));
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

async function startServer() {
  if (isDev) {
    console.log("In dev mode, assuming server is running on port 3001 (via npm run server)");
    await waitForServer(3001);
    return 3001;
  }

  const port = await getFreePort();
  process.env.PORT = String(port);

  // In production, the server is compiled to JavaScript
  const serverEntry = path.join(process.resourcesPath, "server", "dist", "index.js");

  // Run the server using the bundled Node executable or system Node
  serverProcess = spawn(process.execPath, [serverEntry], {
    env: { ...process.env, PORT: String(port), ELECTRON_RUN_AS_NODE: "1" },
    cwd: process.resourcesPath,
    stdio: "pipe",
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`[server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[server] ${data.toString().trim()}`);
  });

  serverProcess.on("error", (err) => {
    console.error("Failed to start server:", err);
  });

  // Wait for the server to be reachable
  await waitForServer(port);
  console.log(`Server ready on port ${port}`);
  return port;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: "Clinic OS",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Remove default menu
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // In dev mode, load from Vite dev server (already running via dev:full)
    const devUrl = process.env.VITE_DEV_URL || "http://localhost:8080";
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // In production, load the built app but use the embedded server for API
    // Inject the server port so the app knows where to send API requests
    mainWindow.loadURL(`http://localhost:${port}`);
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    const port = await startServer();
    createWindow(port);
  } catch (err) {
    console.error("Failed to initialize:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    startServer().then((port) => createWindow(port));
  }
});
