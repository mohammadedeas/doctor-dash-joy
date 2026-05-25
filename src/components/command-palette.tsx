import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Search,
  Stethoscope,
  Moon,
  Sun,
  LogOut,
  UserPlus,
  Plus,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type CommandAction = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  shortcut?: string;
  action: () => void;
};

export function CommandPaletteProvider() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigation: CommandAction[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Go to Dashboard",
        icon: LayoutDashboard,
        shortcut: "G D",
        action: () => {
          navigate({ to: "/" });
          setOpen(false);
        },
      },
      {
        id: "patients",
        label: "Go to Patients",
        icon: Users,
        shortcut: "G P",
        action: () => {
          navigate({ to: "/patients" });
          setOpen(false);
        },
      },
      {
        id: "visits",
        label: "Go to Visits",
        icon: CalendarDays,
        shortcut: "G V",
        action: () => {
          navigate({ to: "/visits" });
          setOpen(false);
        },
      },
      {
        id: "calendar",
        label: "Go to Calendar",
        icon: Calendar,
        shortcut: "G C",
        action: () => {
          navigate({ to: "/calendar" });
          setOpen(false);
        },
      },
      {
        id: "payments",
        label: "Go to Payments",
        icon: CreditCard,
        shortcut: "G $",
        action: () => {
          navigate({ to: "/payments" });
          setOpen(false);
        },
      },
      {
        id: "reports",
        label: "Go to Reports",
        icon: BarChart3,
        action: () => {
          navigate({ to: "/reports" });
          setOpen(false);
        },
      },
      {
        id: "settings",
        label: "Go to Settings",
        icon: Settings,
        shortcut: "G S",
        action: () => {
          navigate({ to: "/settings" });
          setOpen(false);
        },
      },
    ],
    [navigate]
  );

  const actions: CommandAction[] = useMemo(
    () => [
      {
        id: "new-patient",
        label: "New Patient",
        icon: UserPlus,
        action: () => {
          navigate({ to: "/patients" });
          setOpen(false);
          // Let the page mount then trigger dialog via a custom event
          setTimeout(() => window.dispatchEvent(new CustomEvent("new-patient")), 150);
        },
      },
      {
        id: "new-visit",
        label: "New Visit",
        icon: Plus,
        action: () => {
          navigate({ to: "/" });
          setOpen(false);
          setTimeout(() => window.dispatchEvent(new CustomEvent("new-visit")), 150);
        },
      },
      {
        id: "new-payment",
        label: "Record Payment",
        icon: Wallet,
        action: () => {
          navigate({ to: "/payments" });
          setOpen(false);
        },
      },
      {
        id: "toggle-theme",
        label: "Toggle Theme",
        icon:
          typeof document !== "undefined" && document.documentElement.classList.contains("dark")
            ? Sun
            : Moon,
        action: () => {
          const isDark = document.documentElement.classList.contains("dark");
          document.documentElement.classList.toggle("dark", !isDark);
          localStorage.setItem("clinic_dark_mode", String(!isDark));
          setOpen(false);
        },
      },
      {
        id: "logout",
        label: "Sign Out",
        icon: LogOut,
        action: () => {
          logout();
          setOpen(false);
        },
      },
    ],
    [navigate, logout]
  );

  const all = useMemo(() => [...navigation, ...actions], [navigation, actions]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          <Search className="size-5 mx-auto mb-2 text-muted-foreground/50" />
          No commands found.
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigation.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={item.action}
              className="flex items-center gap-2 cursor-pointer"
            >
              <item.icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                  {item.shortcut.split(" ").map((k, i) => (
                    <span key={i}>{k}</span>
                  ))}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actions.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={item.action}
              className="flex items-center gap-2 cursor-pointer"
            >
              <item.icon className="size-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
