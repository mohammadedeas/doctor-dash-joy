import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Calendar as CalendarIcon,
  CreditCard,
  BarChart3,
  Settings,
  Stethoscope,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Command,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useClinic } from "@/lib/clinic-store";
import { cn } from "@/lib/utils";
import { CommandPaletteProvider } from "@/components/command-palette";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/visits", label: "Visits", icon: CalendarDays },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useClinic();
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const [version, setVersion] = useState<string>("");
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api?.getVersion) {
      api.getVersion().then((v: string) => setVersion(v)).catch(() => {});
    }
  }, []);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <CommandPaletteProvider />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-sidebar h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-sky-400 text-primary-foreground flex items-center justify-center shadow-glow">
              <Stethoscope className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-[15px] truncate leading-tight">
                {state.settings.clinicName}
              </div>
              <div className="text-[11px] font-medium text-muted-foreground tracking-wide">
                Clinic OS
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-transform duration-200",
                    active ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="size-3.5 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Command Palette Hint */}
        <div className="px-4 pb-2">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 text-[11px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Command className="size-3.5" />
            <span className="flex-1 text-left">Command palette</span>
            <kbd className="hidden xl:inline-flex items-center rounded bg-sidebar-border/60 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>
        </div>

        {/* User + Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-sidebar-accent/50">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{user.name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{user.role}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                document.documentElement.classList.toggle("dark", next);
                localStorage.setItem("clinic_dark_mode", String(next));
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              {isDark ? "Light" : "Dark"}
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-destructive-soft hover:text-destructive transition-colors"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 px-1">
            <span>{version ? `Clinic OS v${version}` : "Clinic OS"}</span>
            <LiveClock />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-sky-400 text-primary-foreground flex items-center justify-center">
              <Stethoscope className="size-4" />
            </div>
            <span className="font-display font-bold text-sm truncate">
              {state.settings.clinicName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                document.documentElement.classList.toggle("dark", next);
                localStorage.setItem("clinic_dark_mode", String(next));
              }}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-hide">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/60 hover:bg-muted"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1440px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-[1.65rem] font-semibold font-display tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
