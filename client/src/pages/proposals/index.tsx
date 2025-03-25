import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Proposal, Job } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Loader2, FileText } from "lucide-react";

export default function ProposalsIndex() {
  const { user, isFreelancer } = useAuth();
  
  // Fetch proposals for the current freelancer
  const { 
    data: proposals, 
    isLoading: isProposalsLoading, 
    error: proposalsError 
  } = useQuery<Proposal[]>({
    queryKey: ['/api/proposals'],
    enabled: !!user && isFreelancer,
  });
  
  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">ACCEPTED</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">REJECTED</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-500">UNKNOWN</Badge>;
    }
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Not allowed for clients
  if (!isFreelancer) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">Only freelancers can access the proposals section.</p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  // Loading state
  if (isProposalsLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">My Proposals</h1>
        
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-end">
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (proposalsError) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load proposals</h2>
        <p className="text-gray-600 mb-6">There was an error loading your proposals. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  // Empty state
  if (!proposals || proposals.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">My Proposals</h1>
        
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No proposals yet</h2>
            <p className="text-gray-600 mb-6">You haven't submitted any proposals yet. Browse available jobs to get started.</p>
            <Button asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Proposals ({proposals.length})</h1>
      
      <div className="space-y-6">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center">
                  <CardTitle>Proposal #{proposal.id}</CardTitle>
                </div>
                {getStatusBadge(proposal.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>J{proposal.jobId}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-500">Job #{proposal.jobId}</span>
                  </div>
                  <p className="text-sm text-gray-500">Submitted {formatTimeAgo(proposal.createdAt)}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Your Bid</p>
                    <p className="font-medium">${proposal.bidAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Duration</p>
                    <p className="font-medium">{proposal.estimatedDuration} days</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-500">Cover Letter</p>
                  <p className="text-gray-700 line-clamp-3">{proposal.coverLetter}</p>
                </div>
                
                <div className="flex justify-end">
                  <Button asChild variant="outline">
                    <Link href={`/jobs/${proposal.jobId}`}>View Job</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
