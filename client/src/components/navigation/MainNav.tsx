import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MainNav() {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-primary font-bold text-2xl">
              FreelanceHub
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/jobs" className="text-gray-600 hover:text-primary">
                Find Work
              </Link>
              <Link href="/jobs" className="text-gray-600 hover:text-primary">
                Find Talent
              </Link>
              <Link href="/#how-it-works" className="text-gray-600 hover:text-primary">
                How It Works
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-primary">
                Pricing
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="hidden md:inline-block text-gray-600 hover:text-primary">
                  Dashboard
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => logout()}
                  className="hidden md:inline-flex"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:inline-block text-gray-600 hover:text-primary">
                  Sign In
                </Link>
                <Link href="/signup" className="px-4 py-2 rounded-md bg-primary text-white hover:bg-blue-600">
                  Get Started
                </Link>
              </>
            )}
            
            <button 
              className="md:hidden text-gray-600 focus:outline-none"
              onClick={toggleMenu}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t py-4 px-4">
          <nav className="flex flex-col space-y-3">
            <Link 
              href="/jobs" 
              className="text-gray-600 hover:text-primary py-2"
              onClick={() => setMenuOpen(false)}
            >
              Find Work
            </Link>
            <Link 
              href="/jobs" 
              className="text-gray-600 hover:text-primary py-2"
              onClick={() => setMenuOpen(false)}
            >
              Find Talent
            </Link>
            <Link 
              href="/#how-it-works" 
              className="text-gray-600 hover:text-primary py-2"
              onClick={() => setMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="/#pricing" 
              className="text-gray-600 hover:text-primary py-2"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-primary py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-primary py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="text-primary font-medium py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
