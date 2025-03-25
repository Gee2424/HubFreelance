import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export default function RecentJobs() {
  const { user, isClient } = useAuth();
  
  // Different query depending on user role
  const queryUrl = isClient 
    ? `/api/jobs?clientId=${user?.id}` 
    : '/api/jobs';
    
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: [queryUrl],
    staleTime: 60000, // 1 minute
  });
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Open</span>;
      case "in_progress":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Progress</span>;
      case "completed":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Completed</span>;
      case "canceled":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Canceled</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Job Title</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-red-500">Failed to load jobs. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Handle empty state
  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500 mb-4">
            {isClient 
              ? "You haven't posted any jobs yet." 
              : "No jobs available at the moment."}
          </p>
          {isClient && (
            <Button asChild>
              <Link href="/jobs/post">Post Your First Job</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Limit to recent jobs
  const recentJobs = jobs.slice(0, 3);
  
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Recent Jobs</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Job Title</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Budget</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{job.title}</div>
                  <div className="text-xs text-gray-500">Posted {formatTimeAgo(job.createdAt)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {`C${job.clientId}`}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">Client #{job.clientId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {job.budget ? `$${job.budget}` : job.hourlyRate ? `$${job.hourlyRate}/hr` : "N/A"}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(job.status)}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/jobs/${job.id}`} className="text-primary hover:text-blue-700 text-sm font-medium">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardFooter className="p-4 flex justify-center border-t">
        <Button variant="ghost" asChild>
          <Link href="/jobs" className="text-primary">
            View All Jobs
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
