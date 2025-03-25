import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Mock notification type (replace with actual schema)
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationChannel, setNotificationChannel] = useState<any>(null);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      if (!user) return [];
      
      try {
        return await apiRequest<Notification[]>(queryKey[0] as string, {
          headers: {
            'user-id': user.id.toString()
          }
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    }
  });

  // Calculate unread count
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Set up Supabase real-time subscription
  useEffect(() => {
    if (!user) return;

    async function setupRealtimeNotifications() {
      try {
        // Clean up any existing subscription
        if (notificationChannel) {
          supabase.removeChannel(notificationChannel);
        }

        // Subscribe to the notifications table
        const channel = supabase
          .channel(`notifications-${user?.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user?.id}`,
          }, (payload: any) => {
            const newNotification = payload.new as Notification;
            
            // Refresh notifications list
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            
            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default',
            });
          })
          .subscribe();

        setNotificationChannel(channel);
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    }

    setupRealtimeNotifications();

    // Cleanup function
    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [user, queryClient, toast]);

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest('PATCH', `/api/notifications/${id}/read`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('PATCH', '/api/notifications/read-all', {});
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}