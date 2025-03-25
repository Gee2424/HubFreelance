import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header for auth pages */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-primary font-bold text-2xl">
              FreelanceHub
            </Link>
            <div>
              <Link 
                href={location === "/login" ? "/signup" : "/login"} 
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-blue-600"
              >
                {location === "/login" ? "Sign Up" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {children}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-4 text-center">
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
