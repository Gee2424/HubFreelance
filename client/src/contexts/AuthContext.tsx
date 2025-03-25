import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { signIn, signOut as supabaseSignOut, getCurrentUser } from '@/lib/supabase';
import { useLocation } from 'wouter';
import type { UserRole } from '@/types';

// Define User interface that matches our database schema
interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  fullName?: string;
  bio?: string | null;
  avatar?: string | null;
  skills?: string[] | null;
  hourlyRate?: number | null;
  location?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isClient: boolean;
  isFreelancer: boolean;
  isSupport: boolean;
  isQA: boolean;
  isDisputeResolver: boolean;
  isAccounts: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  isClient: false,
  isFreelancer: false,
  isSupport: false,
  isQA: false,
  isDisputeResolver: false,
  isAccounts: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize user on app load
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        
        // First check if we have a user and token in localStorage
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            
            // Verify the user is still valid with a server check using proper auth
            const response = await fetch('/api/users/me', {
              headers: {
                'Authorization': `Bearer ${savedToken}`
              }
            });
            
            if (response.ok) {
              const serverUserData = await response.json();
              setUser(serverUserData);
              localStorage.setItem('user', JSON.stringify(serverUserData));
            } else {
              // If not ok, remove user and token
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setUser(null);
            }
          } catch (e) {
            console.error('Failed to parse user from localStorage', e);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          // Check for Supabase session as a fallback
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // If we have a session, get the user from our API using Supabase token
            try {
              const response = await fetch('/api/users/me', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', session.access_token);
              } else {
                // If our API fails, try to get basic user info from Supabase
                const currentUser = await getCurrentUser();
                if (currentUser) {
                  const userObj = currentUser as unknown as User;
                  setUser(userObj);
                  localStorage.setItem('user', JSON.stringify(userObj));
                  localStorage.setItem('token', session.access_token);
                }
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              toast({
                title: 'Error',
                description: 'Failed to load user profile. Please try refreshing the page.',
                variant: 'destructive',
              });
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', session.access_token);
          } else {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              setUser(currentUser as unknown as User);
              localStorage.setItem('user', JSON.stringify(currentUser));
              localStorage.setItem('token', session.access_token);
            }
          }
        } catch (error) {
          console.error('Error fetching user data on auth change:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      // Read the response body
      const responseData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        throw new Error(responseData.message || responseData.error || 'Login failed');
      }
      
      // Handle case where the server returns user data directly (not nested in a 'user' property)
      // This is the case for our Express backend authentication
      if (responseData && responseData.id) {
        // Store user data directly
        setUser(responseData);
        localStorage.setItem('user', JSON.stringify(responseData));
        
        // If we have a token, store it too
        if (responseData.token) {
          localStorage.setItem('token', responseData.token);
        }
        
        // Use the Authorization header from the response if available
        const authHeader = loginResponse.headers.get('Authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          localStorage.setItem('token', token);
        }
        
        toast({
          title: 'Success',
          description: 'Welcome back!',
          variant: 'default',
        });
        setLocation('/dashboard');
        return;
      }
      
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error?.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear localStorage first
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Update state
      setUser(null);
      
      // Then try to sign out from Supabase - but don't block on this
      try {
        await supabaseSignOut();
      } catch (supabaseError) {
        console.error('Supabase sign out error:', supabaseError);
        // Continue even if Supabase sign out fails
      }
      
      setLocation('/');
      
      toast({
        title: 'Signed out',
        description: 'You have been successfully logged out.',
      });
      
      // Refresh the page to clean up any state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate role-based flags
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const isSupport = user?.role === 'support';
  const isQA = user?.role === 'qa';
  const isDisputeResolver = user?.role === 'dispute_resolution';
  const isAccounts = user?.role === 'accounts';

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    login,
    logout,
    isAdmin,
    isClient,
    isFreelancer,
    isSupport,
    isQA,
    isDisputeResolver,
    isAccounts
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};