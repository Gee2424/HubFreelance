import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Job, Proposal, InsertProposal } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import { Loader2, Calendar, DollarSign, Clock, BriefcaseBusiness } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";

// Form schema for proposals
const proposalSchema = z.object({
  coverLetter: z.string().min(20, {
    message: "Cover letter must be at least 20 characters",
  }),
  bidAmount: z.string().min(1, {
    message: "Bid amount is required",
  }).transform((val) => parseInt(val)),
  estimatedDuration: z.string().min(1, {
    message: "Estimated duration is required",
  }).transform((val) => parseInt(val)),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface JobDetailProps {
  id: string;
}

export default function JobDetail({ id }: JobDetailProps) {
  const { user, isClient, isFreelancer } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showChat, setShowChat] = useState(false);

  // Load job details
  const { 
    data: job, 
    isLoading: isJobLoading, 
    error: jobError 
  } = useQuery<Job>({
    queryKey: [`/api/jobs/${id}`],
  });

  // Load proposals for this job (if client or if freelancer to check if already applied)
  const { 
    data: proposals, 
    isLoading: isProposalsLoading,
    error: proposalsError
  } = useQuery<Proposal[]>({
    queryKey: [`/api/jobs/${id}/proposals`],
    enabled: !!user && (isClient || isFreelancer),
  });

  // Check if the current freelancer has already applied
  const hasApplied = isFreelancer && proposals?.some(p => p.freelancerId === user?.id);

  // Set up form for submitting proposals
  const proposalForm = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      coverLetter: "",
      bidAmount: "",
      estimatedDuration: "",
    },
  });

  // Submit proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: async (values: ProposalFormValues) => {
      const response = await apiRequest(
        "POST", 
        `/api/jobs/${id}/proposals`, 
        values
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal submitted",
        description: "Your proposal has been successfully submitted to this job.",
      });

      // Close the proposal dialog
      setShowProposalDialog(false);

      // Reset form
      proposalForm.reset();

      // Refresh proposals list
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${id}/proposals`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit proposal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // State for proposal dialog
  const [showProposalDialog, setShowProposalDialog] = useState(false);

  // Handle proposal form submission
  const onSubmitProposal = (values: ProposalFormValues) => {
    submitProposalMutation.mutate(values);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not specified";
    return format(new Date(date), "MMM d, yyyy");
  };

  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Loading state
  if (isJobLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading job details...</span>
      </div>
    );
  }

  // Error state
  if (jobError || !job) {
    return (
      <div className="text-center py-12">
        <BriefcaseBusiness className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
        <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main job details */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge 
                  className={
                    job.status === "open" ? "bg-green-100 text-green-800" :
                    job.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    job.status === "completed" ? "bg-gray-100 text-gray-800" :
                    "bg-red-100 text-red-800"
                  }
                >
                  {job.status.replace("_", " ").toUpperCase()}
                </Badge>
                <CardTitle className="mt-2 text-2xl">{job.title}</CardTitle>
              </div>
              <div>
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  {job.budget ? `$${job.budget} fixed` : job.hourlyRate ? `$${job.hourlyRate}/hr` : "Budget not specified"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {job.skills && job.skills.map((skill, i) => (
                <Badge key={i} variant="outline">{skill}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Posted</p>
                  <p className="font-medium">{formatTimeAgo(job.createdAt)}</p>
                </div>
              </div>
              {job.deadlineDate && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-medium">{formatDate(job.deadlineDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">
                    {job.budget ? `$${job.budget} fixed` : job.hourlyRate ? `$${job.hourlyRate}/hr` : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <div className="flex flex-wrap gap-4 w-full justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-2">
                  <AvatarFallback>C{job.clientId}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Client #{job.clientId}</p>
                  <p className="text-sm text-gray-500">{job.category}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {isFreelancer && job.status === "open" && !hasApplied && (
                  <Button onClick={() => setShowProposalDialog(true)}>
                    Submit Proposal
                  </Button>
                )}
                {isFreelancer && hasApplied && (
                  <Button variant="outline" disabled>
                    Proposal Submitted
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowChat(!showChat)}>
                  {showChat ? "Hide Chat" : "Contact Client"}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Chat section that can be toggled */}
        {showChat && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Message Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInterface receiverId={job.clientId} jobId={job.id} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar with proposals info or actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <div className="flex items-center mt-1">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback>C{job.clientId}</AvatarFallback>
                </Avatar>
                <p>Client #{job.clientId}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{job.category}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-500">Posted</p>
              <p className="font-medium">{formatTimeAgo(job.createdAt)}</p>
            </div>

            {job.deadlineDate && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">{formatDate(job.deadlineDate)}</p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="font-medium">{job.budget ? `$${job.budget} fixed` : job.hourlyRate ? `$${job.hourlyRate}/hr` : "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Proposals Card (only shown to client or if freelancer has applied) */}
        {(isClient || hasApplied) && (
          <Card>
            <CardHeader>
              <CardTitle>Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {isProposalsLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Loading proposals...</p>
                </div>
              ) : proposalsError ? (
                <p className="text-sm text-red-500">Failed to load proposals</p>
              ) : proposals && proposals.length > 0 ? (
                <div className="space-y-4">
                  {isClient ? (
                    <p className="text-sm text-gray-500">{proposals.length} freelancers have submitted proposals</p>
                  ) : (
                    <p className="text-sm text-gray-500">You have submitted a proposal</p>
                  )}

                  {isClient && (
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div key={proposal.id} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>F{proposal.freelancerId}</AvatarFallback>
                              </Avatar>
                              <p className="font-medium">Freelancer #{proposal.freelancerId}</p>
                            </div>
                            <Badge className={
                              proposal.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              proposal.status === "accepted" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {proposal.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Bid: ${proposal.bidAmount}</p>
                            <p className="text-sm text-gray-500">Duration: {proposal.estimatedDuration} days</p>
                          </div>
                          <div className="mt-2">
                            <Button size="sm" variant="outline" className="mr-2">View Details</Button>
                            <Button size="sm">Contact</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No proposals yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Proposal Dialog */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit a Proposal</DialogTitle>
            <DialogDescription>
              Provide details about how you can help with this project.
            </DialogDescription>
          </DialogHeader>

          <Form {...proposalForm}>
            <form onSubmit={proposalForm.handleSubmit(onSubmitProposal)} className="space-y-4">
              <FormField
                control={proposalForm.control}
                name="bidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Bid (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter your bid amount" {...field} />
                    </FormControl>
                    <FormDescription>
                      {job.budget ? `Client's budget: $${job.budget}` : job.hourlyRate ? `Client's rate: $${job.hourlyRate}/hr` : "No budget specified"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={proposalForm.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (days)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter estimated completion time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={proposalForm.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe why you're a good fit for this job..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Highlight your relevant experience and approach to the project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowProposalDialog(false)}
                  disabled={submitProposalMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submitProposalMutation.isPending}
                >
                  {submitProposalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Proposal"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}