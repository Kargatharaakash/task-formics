"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  Menu,
  Shield,
  UserCircle2
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AppShellProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/users", label: "Users", icon: Shield, adminOnly: true }
];

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || user.role === Role.ADMIN),
    [user.role]
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setMobileOpen((value) => !value)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">Event Platform</div>
            <Badge variant="secondary" className="text-[10px]">
              {user.role}
            </Badge>
          </div>
          <ThemeToggle compact />
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-58px)] lg:min-h-screen">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />

        <aside
          className={cn(
            "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border/80 bg-card/95 p-4 backdrop-blur transition-transform lg:sticky lg:z-20 lg:h-screen",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed && "lg:w-20"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className={cn("transition-opacity", collapsed && "lg:opacity-0")}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
              <p className="text-lg font-semibold">Event Platform</p>
            </div>
            <div className="hidden items-center gap-1 lg:flex">
              <Button
                variant="ghost"
                size="icon"
                className="inline-flex"
                onClick={() => setCollapsed((value) => !value)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>



          <nav className="space-y-1" aria-label="Sidebar">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "lg:justify-center lg:px-2"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 flex flex-col gap-2">
            <ThemeToggle fullWidth={!collapsed} compact={collapsed} />
            <LogoutButton fullWidth={!collapsed} compact={collapsed} />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-10 pt-4 md:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
