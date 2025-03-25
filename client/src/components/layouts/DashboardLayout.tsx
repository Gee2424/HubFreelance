import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import SideNav from "@/components/navigation/SideNav";
import UserMenu from "@/components/navigation/UserMenu";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isAuthenticated && !loading) {
      setLocation("/login");
      return;
    }
  }, [isAuthenticated, loading, setLocation]);
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }
  
  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <SideNav />
        
        {/* Main Content */}
        <div className="flex-1 overflow-x-hidden">
          {/* Dashboard Header */}
          <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {getPageTitle(location)}
              </h1>
            </div>
            <UserMenu />
          </header>
          
          {/* Dashboard Content */}
          <div className="py-6 px-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to get page title based on current location
function getPageTitle(location: string): string {
  const path = location.split('/')[1]; // Get first segment
  
  switch (path) {
    case "dashboard":
      return "Dashboard";
    case "jobs":
      if (location.includes("/post")) return "Post a Job";
      if (location.match(/\/jobs\/\d+/)) return "Job Details";
      return "Browse Jobs";
    case "proposals":
      return "My Proposals";
    case "messages":
      return "Messages";
    case "profile":
      return "My Profile";
    default:
      return "Dashboard";
  }
}
