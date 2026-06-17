import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Activity, Pill, Settings } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reception", label: "Reception", icon: Users },
    { href: "/lab", label: "Laboratory", icon: Activity },
    { href: "/pharmacy", label: "Pharmacy", icon: Pill },
  ];

  return (
    <aside className="w-16 md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen flex flex-col shrink-0 sticky top-0 h-screen transition-all">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-sidebar-border gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-white shadow-sm shrink-0">
          GH
        </div>
        <div className="hidden md:block font-bold tracking-tight truncate">GLOBAL HOSPITAL</div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col gap-1 px-2 md:px-3">
          {links.map((link) => {
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:block truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border text-center md:text-left text-sidebar-foreground/60 text-xs hidden md:block">
        &copy; 2025 Global Hospital
      </div>
    </aside>
  );
}
