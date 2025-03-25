import { Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  className?: string;
}

export default function JobCard({ job, className }: JobCardProps) {
  // Convert skills array to string for display
  const skills = Array.isArray(job.skills) ? job.skills : [];
  
  // Format the budget
  const formatBudget = () => {
    if (job.budget) {
      return `$${job.budget}`;
    } else if (job.hourlyRate) {
      return `$${job.hourlyRate}/hr`;
    }
    return "Budget not specified";
  };
  
  // Format time since posting
  const timeAgo = job.createdAt 
    ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) 
    : "Recently";
  
  // Map status to badge variant
  const getStatusBadge = () => {
    switch (job.status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canceled</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className={cn("bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden", className)}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Link href={`/jobs/${job.id}`}>
            <h3 className="text-xl font-semibold text-gray-800 hover:text-primary">{job.title}</h3>
          </Link>
          <div className="ml-4 flex-shrink-0">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              {formatBudget()}
            </Badge>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              {skill}
            </Badge>
          ))}
          {skills.length > 4 && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              +{skills.length - 4} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm text-gray-600">Client #{job.clientId}</span>
          </div>
          <div className="text-sm text-gray-500">Posted {timeAgo}</div>
        </div>
      </div>
      
      <div className="border-t p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <span className="text-sm text-gray-500">Category: {job.category}</span>
          </div>
          <Link href={`/jobs/${job.id}`} className="text-primary font-medium hover:underline">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
