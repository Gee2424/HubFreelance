
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Format Supabase user data to match our app's user type
function formatUserData(user: any) {
  return {
    id: parseInt(user.id),
    email: user.email,
    username: user.user_metadata?.username || user.email,
    fullName: user.user_metadata?.full_name || '',
    role: user.user_metadata?.role || 'freelancer',
    bio: user.user_metadata?.bio || null,
    avatar: user.user_metadata?.avatar_url || null,
    skills: user.user_metadata?.skills || [],
    hourlyRate: user.user_metadata?.hourly_rate || null,
    location: user.user_metadata?.location || null,
    createdAt: new Date(user.created_at)
  };
}

export async function signUp(email: string, password: string, userData: { 
  username: string, 
  fullName: string, 
  role: UserRole 
}) {
  // First create the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userData.username,
        full_name: userData.fullName,
        role: userData.role,
        bio: null,
        avatar_url: null,
        skills: [],
        hourly_rate: null,
        location: null
      }
    }
  });

  if (error) throw error;
  
  // Then create the user in our database via API
  if (data.user) {
    try {
      // Create user record in our database
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use the Supabase token for authorization
          'Authorization': `Bearer ${data.session?.access_token || ''}`
        },
        body: JSON.stringify({
          email,
          username: userData.username,
          password: 'HASHED_IN_BACKEND', // Will be hashed properly in backend
          fullName: userData.fullName,
          role: userData.role,
          bio: null,
          avatar: null,
          skills: [],
          hourlyRate: null,
          location: null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user in database');
      }
      
      return data.user ? formatUserData(data.user) : null;
    } catch (dbError) {
      console.error('Error creating user in database:', dbError);
      // If database creation fails, attempt to delete the auth user to maintain consistency
      await supabase.auth.admin?.deleteUser(data.user.id);
      throw dbError;
    }
  }
  
  return null;
}

export async function signIn(email: string, password: string) {
  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  
  // Get the user data from our API with the token
  if (data.session) {
    try {
      // For our custom backend, we pass the user ID in the header
      const response = await fetch('/api/users/me', {
        headers: {
          'user-id': data.user.id.toString(),
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Save to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        return userData; // Return our actual user object from the database
      } else {
        console.warn('User authenticated but not found in database');
        // Try authentication with test accounts
        if (email.includes('@example.com')) {
          try {
            // Try logging in with /api/auth/login endpoint for test accounts
            const loginResponse = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: email,
                password: password
              })
            });

            if (loginResponse.ok) {
              const userData = await loginResponse.json();
              localStorage.setItem('user', JSON.stringify(userData));
              return userData;
            }
          } catch (error) {
            console.error('Test account login error:', error);
          }
        }
      }
    } catch (dbError) {
      console.error('Error fetching user data:', dbError);
    }
  }
  
  // Fallback to Supabase user format if our API fails
  const formattedUser = data.user ? formatUserData(data.user) : null;
  if (formattedUser) {
    localStorage.setItem('user', JSON.stringify(formattedUser));
  }
  return formattedUser;
}

export async function signOut() {
  // Clear any local session data
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user ? formatUserData(user) : null;
}

// Realtime subscriptions for messages
export function subscribeToMessages(userId: number, callback: (message: any) => void) {
  return supabase
    .channel(`messages:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
}
