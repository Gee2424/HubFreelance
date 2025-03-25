import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { RecentActivity as RecentActivityType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { user } = useAuth();
  
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
    staleTime: 60000, // 1 minute
  });
  
  // Convert API data to our frontend type
  const formatActivities = (activities: Activity[]): RecentActivityType[] => {
    return activities.map(activity => {
      let icon = 'bell';
      let color = 'blue';
      let message = 'New activity';
      
      switch (activity.type) {
        case 'job_posted':
          icon = 'briefcase';
          color = 'blue';
          message = `You posted a new job: "${activity.metadata?.jobTitle || 'Untitled Job'}"`;
          break;
        case 'proposal_submitted':
          icon = 'file-alt';
          color = 'indigo';
          message = `You submitted a proposal for a job`;
          break;
        case 'message_sent':
          icon = 'comment-dots';
          color = 'blue';
          message = `You received a message`;
          if (activity.metadata?.receiverId === user?.id) {
            message = `You received a message from User #${activity.metadata.senderId}`;
          }
          break;
        case 'contract_created':
          icon = 'handshake';
          color = 'green';
          message = `A contract was created for job #${activity.metadata?.jobId}`;
          break;
        case 'payment_released':
          icon = 'dollar-sign';
          color = 'green';
          message = `Payment of $${activity.metadata?.amount} was released`;
          break;
        case 'review_submitted':
          icon = 'star';
          color = 'yellow';
          message = `You received a ${activity.metadata?.rating}-star review`;
          break;
      }
      
      return {
        id: activity.id,
        icon,
        color,
        message,
        timestamp: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
      };
    });
  };
  
  // Get icon class based on icon name
  const getIconClass = (icon: string) => {
    return `fas fa-${icon}`;
  };
  
  // Get background color based on color name
  const getIconBgColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 flex items-center justify-center text-primary';
      case 'green':
        return 'bg-green-100 flex items-center justify-center text-secondary';
      case 'indigo':
        return 'bg-indigo-100 flex items-center justify-center text-accent';
      case 'yellow':
        return 'bg-yellow-100 flex items-center justify-center text-yellow-500';
      default:
        return 'bg-gray-100 flex items-center justify-center text-gray-500';
    }
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" disabled>View All</Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex">
                <div className="flex-shrink-0 mr-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div>
                  <Skeleton className="h-5 w-64 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-red-500">Failed to load activities. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Handle empty state
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No activity yet. Your recent actions will appear here.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Format and limit to 3 most recent activities
  const recentActivities = formatActivities(activities).slice(0, 3);
  
  return (
    <Card>
      <CardHeader className="border-b flex justify-between items-center">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activities">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className={`h-10 w-10 rounded-full ${getIconBgColor(activity.color)}`}>
                  <i className={`${getIconClass(activity.icon)}`}></i>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
