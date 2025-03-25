import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat/ChatInterface";

// Mock dispute type (replace with actual schema)
interface Dispute {
  id: number;
  title: string;
  description: string;
  status: "pending" | "reviewing" | "mediation" | "resolved" | "closed";
  contractId: number;
  clientId: number;
  freelancerId: number;
  assignedToId: number | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  freelancer?: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  contract?: {
    id: number;
    title: string;
    value: number;
    status: string;
  };
}

// Form schema for resolution
const resolutionSchema = z.object({
  decision: z.enum(["client", "freelancer", "partial"]),
  refundAmount: z.number().optional(),
  explanation: z.string().min(20, "Explanation must be at least 20 characters"),
  notifyParties: z.boolean().default(true),
});

type ResolutionFormValues = z.infer<typeof resolutionSchema>;

export default function DisputeResolution() {
  const { user, isQA, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form definition for resolution
  const form = useForm<ResolutionFormValues>({
    resolver: zodResolver(resolutionSchema),
    defaultValues: {
      decision: "partial",
      explanation: "",
      notifyParties: true,
    },
  });

  // Fetch disputes
  const { data: disputes = [], isLoading: isLoadingDisputes } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes", { tab: selectedTab }],
    enabled: !!user && (isQA || isAdmin),
  });

  // Assign dispute mutation
  const assignDisputeMutation = useMutation({
    mutationFn: async (disputeId: number) => {
      if (!user) return null;
      const response = await apiRequest("PATCH", `/api/disputes/${disputeId}/assign`, {
        assignedToId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({
        title: "Dispute assigned",
        description: "This dispute has been assigned to you for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign dispute",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Update dispute status mutation
  const updateDisputeStatusMutation = useMutation({
    mutationFn: async ({ disputeId, status }: { disputeId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/disputes/${disputeId}/status`, {
        status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({
        title: "Status updated",
        description: "The dispute status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, resolution }: { disputeId: number; resolution: ResolutionFormValues }) => {
      const response = await apiRequest("POST", `/api/disputes/${disputeId}/resolve`, resolution);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({
        title: "Dispute resolved",
        description: "Your resolution has been recorded and parties have been notified.",
      });
      setResolutionDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to resolve dispute",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle assign to me
  const handleAssignToMe = (disputeId: number) => {
    assignDisputeMutation.mutate(disputeId);
  };

  // Handle status change
  const handleStatusChange = (disputeId: number, status: string) => {
    updateDisputeStatusMutation.mutate({ disputeId, status });
  };

  // Handle submit resolution
  const onSubmitResolution = (values: ResolutionFormValues) => {
    if (!selectedDispute) return;
    resolveDisputeMutation.mutate({ disputeId: selectedDispute.id, resolution: values });
  };

  // Filter disputes based on selected tab and search query
  const filteredDisputes = disputes.filter((dispute) => {
    if (
      searchQuery &&
      !dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !dispute.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    
    // Filter by tab
    if (selectedTab === "pending") {
      return ["pending", "reviewing"].includes(dispute.status);
    } else if (selectedTab === "mediation") {
      return dispute.status === "mediation";
    } else if (selectedTab === "resolved") {
      return ["resolved", "closed"].includes(dispute.status);
    } else if (selectedTab === "my") {
      return dispute.assignedToId === user?.id;
    }
    
    return true;
  });

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "reviewing":
        return "info";
      case "mediation":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
      default:
        return "secondary";
    }
  };

  // Get display name
  const getDisplayName = (person: any) => {
    return person?.fullName || person?.username || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dispute Resolution</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Assurance - Dispute Management</CardTitle>
          <CardDescription>
            Review and resolve disputes between clients and freelancers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="mediation">In Mediation</TabsTrigger>
                <TabsTrigger value="my">My Cases</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search disputes..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDisputes ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin inline-block" />
                      <span className="ml-2">Loading disputes...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredDisputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No disputes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-medium">#{dispute.id}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setDisputeDialogOpen(true);
                        }}
                      >
                        {dispute.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {dispute.client?.avatar && (
                              <AvatarImage src={dispute.client.avatar} />
                            )}
                            <AvatarFallback>
                              {getDisplayName(dispute.client)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getDisplayName(dispute.client)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {dispute.freelancer?.avatar && (
                              <AvatarImage src={dispute.freelancer.avatar} />
                            )}
                            <AvatarFallback>
                              {getDisplayName(dispute.freelancer)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getDisplayName(dispute.freelancer)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(dispute.status)}>
                          {dispute.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${dispute.contract?.value?.toFixed(2) || "N/A"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(dispute.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setDisputeDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                          {["pending", "reviewing"].includes(dispute.status) && !dispute.assignedToId && (
                            <Button
                              size="sm"
                              onClick={() => handleAssignToMe(dispute.id)}
                              disabled={assignDisputeMutation.isPending}
                            >
                              Take Case
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dispute detail dialog */}
      {selectedDispute && (
        <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Dispute #{selectedDispute.id}:{" "}
                <span className="text-primary">{selectedDispute.title}</span>
                <Badge variant={getStatusColor(selectedDispute.status)} className="ml-2">
                  {selectedDispute.status.replace("_", " ")}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Filed on{" "}
                {format(new Date(selectedDispute.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dispute Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{selectedDispute.description}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Client Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChatInterface receiverId={selectedDispute.clientId} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Freelancer Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChatInterface receiverId={selectedDispute.freelancerId} />
                    </CardContent>
                  </Card>
                </div>

                {selectedDispute.resolution && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resolution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{selectedDispute.resolution}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dispute Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Contract</Label>
                      <div className="mt-1">
                        <Button variant="link" className="p-0 h-auto">
                          View Contract #{selectedDispute.contractId}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Contract Value</Label>
                      <div className="mt-1 font-semibold">
                        ${selectedDispute.contract?.value?.toFixed(2) || "N/A"}
                      </div>
                    </div>

                    <div>
                      <Label>Assigned To</Label>
                      <div className="mt-1">
                        {selectedDispute.assignedToId ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>QA</AvatarFallback>
                            </Avatar>
                            <span>
                              {selectedDispute.assignedToId === user?.id
                                ? "You"
                                : "QA Agent"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Unassigned</span>
                            <Button
                              size="sm"
                              onClick={() => handleAssignToMe(selectedDispute.id)}
                              disabled={assignDisputeMutation.isPending}
                            >
                              {assignDisputeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Take Case"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Update Status</Label>
                      <Select
                        value={selectedDispute.status}
                        onValueChange={(value) => handleStatusChange(selectedDispute.id, value)}
                        disabled={updateDisputeStatusMutation.isPending}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="mediation">Mediation</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {selectedDispute.status !== "resolved" && selectedDispute.status !== "closed" && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setResolutionDialogOpen(true);
                        }}
                        disabled={!selectedDispute.assignedToId || selectedDispute.assignedToId !== user?.id}
                      >
                        {!selectedDispute.assignedToId || selectedDispute.assignedToId !== user?.id ? (
                          "You must be assigned to resolve"
                        ) : (
                          "Resolve Dispute"
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Parties Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Client</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {selectedDispute.client?.avatar && (
                            <AvatarImage src={selectedDispute.client.avatar} />
                          )}
                          <AvatarFallback>
                            {getDisplayName(selectedDispute.client)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getDisplayName(selectedDispute.client)}</span>
                      </div>
                    </div>

                    <div>
                      <Label>Freelancer</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {selectedDispute.freelancer?.avatar && (
                            <AvatarImage src={selectedDispute.freelancer.avatar} />
                          )}
                          <AvatarFallback>
                            {getDisplayName(selectedDispute.freelancer)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getDisplayName(selectedDispute.freelancer)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Resolution form dialog */}
      {selectedDispute && (
        <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
              <DialogDescription>
                Make a fair and impartial decision based on the evidence provided by both parties.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitResolution)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="decision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decision</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select decision" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">In favor of client</SelectItem>
                          <SelectItem value="freelancer">In favor of freelancer</SelectItem>
                          <SelectItem value="partial">Partial resolution</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("decision") === "partial" && (
                  <FormField
                    control={form.control}
                    name="refundAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refund Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter refund amount"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed explanation of your decision and reasoning..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifyParties"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Notify both parties via email</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setResolutionDialogOpen(false)}
                    disabled={resolveDisputeMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={resolveDisputeMutation.isPending}
                  >
                    {resolveDisputeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Resolution"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}