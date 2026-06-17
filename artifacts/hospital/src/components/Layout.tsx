import { Link, useLocation } from "wouter";
import { LayoutDashboard, UserPlus, FlaskConical, Pill, Menu, X, Hospital } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/reception", icon: UserPlus, label: "Reception" },
  { href: "/lab", icon: FlaskConical, label: "Laboratory" },
  { href: "/pharmacy", icon: Pill, label: "Pharmacy" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground shrink-0 transition-all duration-200 no-print",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary shrink-0">
            <Hospital className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-white leading-tight tracking-wide">GLOBAL</p>
              <p className="font-bold text-sm text-white leading-tight tracking-wide">HOSPITAL</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors text-sm font-medium",
                    collapsed ? "justify-center" : "",
                    active
                      ? "bg-sidebar-primary text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors text-sm", collapsed && "justify-center")}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <><X className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
