import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Wallet, 
  UserCircle, 
  Settings,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SideNav() {
  const { user, isClient, isFreelancer } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: isClient ? "My Jobs" : "Find Jobs",
      href: "/jobs",
      icon: Briefcase,
    },
    {
      name: "Proposals",
      href: "/proposals",
      icon: FileText,
      show: isFreelancer, // Only show for freelancers
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      badge: 4, // Example badge, would be dynamic in real app
    },
    {
      name: "Wallet",
      href: "/wallet",
      icon: Wallet,
    },
  ];
  
  const settingsItems = [
    {
      name: "Profile",
      href: "/profile",
      icon: UserCircle,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];
  
  return (
    <aside className={cn(
      "bg-white shadow-md h-screen sticky top-0 transition-all duration-300",
      collapsed ? "w-20" : "w-64",
      "hidden md:block"
    )}>
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && (
          <Link href="/" className="text-primary font-bold text-xl">
            FreelanceHub
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="text-primary font-bold text-xl mx-auto">
            FH
          </Link>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-0 h-auto"
        >
          {collapsed ? "→" : "←"}
        </Button>
      </div>
      
      <nav className="mt-6">
        <div className={cn(
          "mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider",
          collapsed ? "text-center" : "px-4"
        )}>
          {!collapsed && "Main"}
        </div>
        
        {navItems.map((item) => (
          // Skip items that should be hidden based on user role
          item.show === false ? null : (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-700",
                location === item.href ? "text-gray-700 bg-gray-100 border-l-4 border-primary" : "hover:border-l-4 hover:border-primary",
                collapsed ? "justify-center" : "px-4"
              )}
            >
              <item.icon className={cn(
                collapsed ? "mx-auto" : "mr-3",
                "h-5 w-5"
              )} />
              {!collapsed && item.name}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold w-4 h-4 flex items-center justify-center rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        ))}
        
        <div className={cn(
          "mt-6 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider",
          collapsed ? "text-center" : "px-4"
        )}>
          {!collapsed && "Settings"}
        </div>
        
        {settingsItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex items-center py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-700",
              location === item.href ? "text-gray-700 bg-gray-100 border-l-4 border-primary" : "hover:border-l-4 hover:border-primary",
              collapsed ? "justify-center" : "px-4"
            )}
          >
            <item.icon className={cn(
              collapsed ? "mx-auto" : "mr-3",
              "h-5 w-5"
            )} />
            {!collapsed && item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
