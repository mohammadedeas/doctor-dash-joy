import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  BarChart3,
  Settings,
  Stethoscope,
} from "lucide-react";
import { useClinic } from "@/lib/clinic-store";
import { cn } from "@/lib/utils";

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
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useClinic();
  const { pathname } = useLocation();

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:flex flex-col border-r border-border bg-sidebar">
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Stethoscope className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-[15px] truncate">
                {state.settings.clinicName}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Clinic OS
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-border text-[11px] text-muted-foreground">
          Data stored on server (SQLite)
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 bg-sidebar border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Stethoscope className="size-4" />
            </div>
            <span className="font-display font-semibold text-sm truncate">
              {state.settings.clinicName}
            </span>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                  active
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground/70 hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="px-4 py-6 lg:px-10 lg:py-8 max-w-[1400px] w-full">
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
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
