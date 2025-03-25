import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Message, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

// Helper to get unique conversation partners from messages
const getUniqueConversations = (messages: Message[], currentUserId: number) => {
  // Group messages by conversation partner
  const conversations = messages.reduce((acc, message) => {
    const partnerId = message.senderId === currentUserId 
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
      latestMessage: sortedMessages[0]
    };
  });
};

export default function RecentMessages() {
  const { user } = useAuth();
  
  // Mock users for displaying names (in a real app, we would fetch these)
  const mockUsers: Record<number, { name: string, avatar?: string }> = {
    2: { name: "Sarah Wilson", avatar: "https://randomuser.me/api/portraits/women/42.jpg" },
    3: { name: "David Chen", avatar: "https://randomuser.me/api/portraits/men/67.jpg" },
    4: { name: "Jessica Miller", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }
  };
  
  // In a real app, we would fetch all messages for the current user
  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    staleTime: 60000, // 1 minute
    enabled: !!user
  });
  
  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: false });
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle>Recent Messages</CardTitle>
          <Button variant="ghost" size="sm" disabled>View All</Button>
        </CardHeader>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-full mr-4" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-red-500">Failed to load messages. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Handle empty state
  if (!messages || messages.length === 0 || !user) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500 mb-4">You don't have any messages yet.</p>
          <Button asChild>
            <Link href="/messages">Start a Conversation</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Get unique conversations (most recent message with each user)
  const conversations = getUniqueConversations(messages, user.id)
    .sort((a, b) => 
      new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime()
    )
    .slice(0, 3); // Show only 3 most recent conversations
  
  return (
    <Card>
      <CardHeader className="border-b flex justify-between items-center">
        <CardTitle>Recent Messages</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/messages">View All</Link>
        </Button>
      </CardHeader>
      <div className="divide-y divide-gray-200">
        {conversations.map(({ partnerId, latestMessage }) => {
          const isReceived = latestMessage.senderId !== user.id;
          const partnerInfo = mockUsers[partnerId] || { name: `User #${partnerId}` };
          
          return (
            <div key={partnerId} className="p-4 hover:bg-gray-50 cursor-pointer">
              <Link href={`/messages?userId=${partnerId}`}>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    {partnerInfo.avatar && <AvatarImage src={partnerInfo.avatar} alt={partnerInfo.name} />}
                    <AvatarFallback>{partnerInfo.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{partnerInfo.name}</h3>
                      <span className="text-xs text-gray-500">{formatTimeAgo(latestMessage.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {isReceived ? "" : "You: "}{latestMessage.content}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      {conversations.length === 0 && (
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No messages to display.</p>
        </CardContent>
      )}
      {conversations.length > 0 && (
        <CardFooter className="p-4 flex justify-center border-t">
          <Button variant="ghost" asChild>
            <Link href="/messages" className="text-primary">
              View All Messages
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
