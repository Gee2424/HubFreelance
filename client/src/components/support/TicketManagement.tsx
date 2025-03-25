import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCaption,
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat/ChatInterface";

// Mock ticket type (replace with actual schema)
interface Ticket {
  id: number;
  title: string;
  description: string;
  type: "support" | "complaint" | "bug" | "feature" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "new" | "in_progress" | "pending" | "resolved" | "closed";
  userId: number;
  assignedToId: number | null;
  contractId?: number;
  jobId?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
    email: string;
  };
}

export default function TicketManagement() {
  const { user, isSupport, isQA, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("open");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [response, setResponse] = useState("");

  // Fetch tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", { tab: selectedTab }],
    enabled: !!user && (isSupport || isQA || isAdmin),
  });

  // Assign ticket mutation
  const assignTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      if (!user) return null;
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/assign`, {
        assignedToId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket assigned",
        description: "This ticket has been assigned to you.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign ticket",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Update ticket status mutation
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, {
        status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Status updated",
        description: "The ticket status has been updated.",
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

  // Respond to ticket mutation
  const respondToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/responses`, {
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Response sent",
        description: "Your response has been sent to the user.",
      });
      setResponse("");
      setTicketDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send response",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle assign to me
  const handleAssignToMe = (ticketId: number) => {
    assignTicketMutation.mutate(ticketId);
  };

  // Handle status change
  const handleStatusChange = (ticketId: number, status: string) => {
    updateTicketStatusMutation.mutate({ ticketId, status });
  };

  // Handle submit response
  const handleSubmitResponse = (ticketId: number) => {
    if (!response.trim()) return;
    respondToTicketMutation.mutate({ ticketId, message: response });
  };

  // Filter tickets based on selected filters and search query
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter && ticket.status !== statusFilter) return false;
    if (priorityFilter && ticket.priority !== priorityFilter) return false;
    if (typeFilter && ticket.type !== typeFilter) return false;
    if (
      searchQuery &&
      !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    
    // Filter by tab
    if (selectedTab === "open") {
      return ["new", "in_progress", "pending"].includes(ticket.status);
    } else if (selectedTab === "resolved") {
      return ["resolved", "closed"].includes(ticket.status);
    } else if (selectedTab === "my") {
      return ticket.assignedToId === user?.id;
    }
    
    return true;
  });

  // Get color for priority badge
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
      default:
        return "secondary";
    }
  };

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "default";
      case "in_progress":
        return "info";
      case "pending":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ticket Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            Manage and respond to user tickets, complaints, and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="open">Open Tickets</TabsTrigger>
                <TabsTrigger value="my">My Tickets</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search tickets..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Select
                value={statusFilter || ""}
                onValueChange={(val) => setStatusFilter(val || null)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter || ""}
                onValueChange={(val) => setPriorityFilter(val || null)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={typeFilter || ""}
                onValueChange={(val) => setTypeFilter(val || null)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter(null);
                  setPriorityFilter(null);
                  setTypeFilter(null);
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>

            <TabsContent value="open" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTickets ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin inline-block" />
                        <span className="ml-2">Loading tickets...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">#{ticket.id}</TableCell>
                        <TableCell
                          className="max-w-[200px] truncate cursor-pointer hover:text-primary"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setTicketDialogOpen(true);
                          }}
                        >
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {ticket.user?.avatar && (
                                <AvatarImage src={ticket.user.avatar} />
                              )}
                              <AvatarFallback>
                                {ticket.user?.fullName?.[0] || ticket.user?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {ticket.user?.fullName || ticket.user?.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setTicketDialogOpen(true);
                              }}
                            >
                              View
                            </Button>
                            {!ticket.assignedToId && (
                              <Button
                                size="sm"
                                onClick={() => handleAssignToMe(ticket.id)}
                                disabled={assignTicketMutation.isPending}
                              >
                                Assign to me
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTickets ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin inline-block" />
                        <span className="ml-2">Loading tickets...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No tickets assigned to you
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">#{ticket.id}</TableCell>
                        <TableCell
                          className="max-w-[200px] truncate cursor-pointer hover:text-primary"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setTicketDialogOpen(true);
                          }}
                        >
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {ticket.user?.avatar && (
                                <AvatarImage src={ticket.user.avatar} />
                              )}
                              <AvatarFallback>
                                {ticket.user?.fullName?.[0] || ticket.user?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {ticket.user?.fullName || ticket.user?.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setTicketDialogOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTickets ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin inline-block" />
                        <span className="ml-2">Loading tickets...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No resolved tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">#{ticket.id}</TableCell>
                        <TableCell
                          className="max-w-[200px] truncate cursor-pointer hover:text-primary"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setTicketDialogOpen(true);
                          }}
                        >
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {ticket.user?.avatar && (
                                <AvatarImage src={ticket.user.avatar} />
                              )}
                              <AvatarFallback>
                                {ticket.user?.fullName?.[0] || ticket.user?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {ticket.user?.fullName || ticket.user?.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setTicketDialogOpen(true);
                              }}
                            >
                              View
                            </Button>
                            {ticket.status === "resolved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(ticket.id, "closed")}
                                disabled={updateTicketStatusMutation.isPending}
                              >
                                Close
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ticket detail dialog */}
      {selectedTicket && (
        <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Ticket #{selectedTicket.id}:{" "}
                <span className="text-primary">{selectedTicket.title}</span>
                <Badge variant={getPriorityColor(selectedTicket.priority)} className="ml-2">
                  {selectedTicket.priority}
                </Badge>
                <Badge variant={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status.replace("_", " ")}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Submitted on{" "}
                {format(new Date(selectedTicket.createdAt), "MMMM d, yyyy 'at' h:mm a")} by{" "}
                {selectedTicket.user?.fullName || selectedTicket.user?.username}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{selectedTicket.description}</p>
                  </CardContent>
                </Card>

                {selectedTicket.userId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Communication with User</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChatInterface receiverId={selectedTicket.userId} />
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ticket Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <div>
                        <Badge variant="outline" className="mt-1">
                          {selectedTicket.type}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Assigned To</Label>
                      <div className="mt-1">
                        {selectedTicket.assignedToId ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>S</AvatarFallback>
                            </Avatar>
                            <span>
                              {selectedTicket.assignedToId === user?.id
                                ? "You"
                                : "Staff Member"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Unassigned</span>
                            <Button
                              size="sm"
                              onClick={() => handleAssignToMe(selectedTicket.id)}
                              disabled={assignTicketMutation.isPending}
                            >
                              {assignTicketMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Assign to me"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Update Status</Label>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                        disabled={updateTicketStatusMutation.isPending}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="pending">Pending User Input</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTicket.contractId && (
                      <div>
                        <Label>Related Contract</Label>
                        <div className="mt-1">
                          <Button variant="link" className="p-0 h-auto">
                            View Contract #{selectedTicket.contractId}
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedTicket.jobId && (
                      <div>
                        <Label>Related Job</Label>
                        <div className="mt-1">
                          <Button variant="link" className="p-0 h-auto">
                            View Job #{selectedTicket.jobId}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Type your response to the user..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button
                      onClick={() => handleSubmitResponse(selectedTicket.id)}
                      disabled={!response.trim() || respondToTicketMutation.isPending}
                    >
                      {respondToTicketMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Response"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}