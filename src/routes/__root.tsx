import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import { useEffect, useLayoutEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ClinicProvider } from "@/lib/clinic-store";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialogHost } from "@/components/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Clinic OS — Dental Practice Management" },
      { name: "description", content: "Manage patients, visits, payments and reports for your dental clinic." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("clinic_dark_mode");
    if (saved === "true") {
      document.documentElement.classList.add("dark");
    }
  }, []);
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Outlet />
      </AuthGuard>
    </AuthProvider>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  useLayoutEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && pathname !== "/login") {
      router.navigate({ to: "/login", replace: true });
    }
    if (isAuthenticated && pathname === "/login") {
      router.navigate({ to: "/", replace: true });
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-sky-400 flex items-center justify-center animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="absolute inset-0 size-12 rounded-xl bg-primary/20 animate-ping" />
          </div>
          <div className="space-y-2 text-center">
            <div className="h-2.5 w-24 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-2 w-16 bg-muted/60 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated and not on login page, show nothing while redirecting
  if (!isAuthenticated && pathname !== "/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    );
  }

  // If authenticated and on login page, show nothing while redirecting
  if (isAuthenticated && pathname === "/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {children}
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

  return (
    <ClinicProvider>
      <AppShell>
        {children}
      </AppShell>
      <ConfirmDialogHost />
      <Toaster richColors position="bottom-right" />
    </ClinicProvider>
  );
}
