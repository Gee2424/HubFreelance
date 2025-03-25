import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Message, InsertMessage } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { subscribeToMessages } from "@/lib/supabase";

interface ChatInterfaceProps {
  receiverId: number;
  jobId?: number;
}

export default function ChatInterface({ receiverId, jobId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Get receiver information
  const { data: receiver, isLoading: isLoadingReceiver } = useQuery<User>({
    queryKey: [`/api/users/${receiverId}`],
    enabled: !!receiverId,
  });
  
  // Get messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${receiverId}`],
    enabled: !!receiverId && !!user,
    refetchInterval: 10000, // Refetch every 10 seconds as a fallback if real-time fails
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !receiverId) return null;
      
      const messageData: Partial<InsertMessage> = {
        senderId: user.id,
        receiverId,
        content,
      };
      
      if (jobId) {
        messageData.jobId = jobId;
      }
      
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onSuccess: () => {
      // Clear the input field
      setNewMessage("");
      
      // Invalidate messages cache to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${receiverId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Setup real-time messaging with Supabase (if available)
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToMessages(user.id, (newMsg) => {
      // If the new message is from our current conversation, update the messages
      if (newMsg.senderId === receiverId || newMsg.receiverId === receiverId) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${receiverId}`] });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [user, receiverId, queryClient]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };
  
  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Get display name for the recipient
  const getReceiverName = () => {
    if (isLoadingReceiver) return "Loading...";
    if (!receiver) return `User #${receiverId}`;
    return receiver.fullName || receiver.username;
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Format timestamp
  const formatMessageTime = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Please sign in to use the messaging system.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b py-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            {receiver?.avatar && <AvatarImage src={receiver.avatar} alt={getReceiverName()} />}
            <AvatarFallback>{getReceiverName().charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{getReceiverName()}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        {isLoadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex max-w-[80%]">
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        {receiver?.avatar && <AvatarImage src={receiver.avatar} alt={getReceiverName()} />}
                        <AvatarFallback>{getReceiverName().charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-end gap-2">
          <Textarea
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] resize-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            size="icon"
            className="h-10 w-10"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
