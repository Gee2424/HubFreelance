import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Message, User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import { subscribeToMessages } from "@/lib/supabase";

export default function MessagesIndex() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Check URL params for selectedUserId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    if (userId) {
      setSelectedUserId(parseInt(userId));
    }
  }, []);
  
  // Setup real-time messaging with Supabase (if available)
  useEffect(() => {
    if (!user) return;
    
    let subscription: { unsubscribe?: () => void } = {};
    try {
      subscription = subscribeToMessages(user.id, (newMsg) => {
        // Invalidate messages to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        
        // If we have a selected conversation and the message is from that user,
        // also invalidate the specific conversation
        if (selectedUserId && (newMsg.senderId === selectedUserId || newMsg.receiverId === selectedUserId)) {
          queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedUserId}`] });
        }
      });
    } catch (error) {
      console.error('Error setting up real-time messaging:', error);
    }
    
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [user, selectedUserId, queryClient]);
  
  // Fetch all messages to identify unique conversations
  const { 
    data: messages, 
    isLoading: isMessagesLoading, 
    error: messagesError 
  } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!user,
  });
  
  // Helper to get unique conversation partners from messages
  const getUniqueConversations = (messages: Message[]) => {
    if (!user) return [];
    
    // Group messages by conversation partner
    const conversations = messages.reduce((acc, message) => {
      const partnerId = message.senderId === user.id 
        ? message.receiverId 
        : message.senderId;
      
      if (!acc[partnerId]) {
        acc[partnerId] = [];
      }
      
      acc[partnerId].push(message);
      return acc;
    }, {} as Record<number, Message[]>);
    
    // Get the most recent message for each conversation
    return Object.entries(conversations).map(([partnerId, messages]) => {
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        partnerId: parseInt(partnerId),
        latestMessage: sortedMessages[0],
        unreadCount: sortedMessages.filter(m => !m.read && m.receiverId === user.id).length
      };
    }).sort((a, b) => 
      new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime()
    );
  };
  
  // Filter conversations by search term
  const filteredConversations = messages 
    ? getUniqueConversations(messages).filter(convo => {
        // In a real app, we would search by user name
        // For now, just search by user ID
        return convo.partnerId.toString().includes(searchTerm);
      })
    : [];
  
  // Mock users for displaying names (in a real app, we would fetch these)
  const mockUsers: Record<number, { name: string, avatar?: string }> = {
    2: { name: "Sarah Wilson", avatar: "https://randomuser.me/api/portraits/women/42.jpg" },
    3: { name: "David Chen", avatar: "https://randomuser.me/api/portraits/men/67.jpg" },
    4: { name: "Jessica Miller", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: false });
  };
  
  // Get display name for a user
  const getUserDisplayName = (userId: number) => {
    return mockUsers[userId]?.name || `User #${userId}`;
  };
  
  return (
    <div className="h-[calc(100vh-140px)]">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Conversations list */}
        <div className="md:border-r pr-0 md:pr-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {isMessagesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-md">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messagesError ? (
              <div className="text-center p-4">
                <p className="text-red-500">Failed to load messages</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/messages'] })}
                >
                  Retry
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-4">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map(({ partnerId, latestMessage, unreadCount }) => {
                  const isSelected = partnerId === selectedUserId;
                  const isReceived = latestMessage.receiverId === user?.id;
                  const partner = mockUsers[partnerId] || { name: `User #${partnerId}` };
                  
                  return (
                    <div
                      key={partnerId}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-gray-100 ${
                        isSelected ? "bg-gray-100" : ""
                      }`}
                      onClick={() => setSelectedUserId(partnerId)}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          {partner.avatar && <AvatarImage src={partner.avatar} alt={partner.name} />}
                          <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-800 truncate">
                            {partner.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(latestMessage.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${unreadCount > 0 ? "font-medium" : "text-gray-500"}`}>
                          {isReceived ? "" : "You: "}{latestMessage.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="md:col-span-2">
          {selectedUserId ? (
            <ChatInterface receiverId={selectedUserId} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                <p className="text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
