import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define form schema
const ticketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)"),
  type: z.enum(["support", "complaint", "bug", "feature", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  contractId: z.number().optional(),
  jobId: z.number().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface SupportTicketProps {
  contractId?: number;
  jobId?: number;
  trigger?: React.ReactNode;
}

export default function SupportTicket({ contractId, jobId, trigger }: SupportTicketProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form definition
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "support",
      priority: "medium",
      contractId,
      jobId,
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const response = await apiRequest("POST", "/api/tickets", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted successfully.",
      });
      setOpen(false);
      form.reset();
      
      // Invalidate tickets queries
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      
      // If this ticket is related to a job or contract, invalidate those too
      if (jobId) {
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      }
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}`] });
      }
      
      // Create activity record
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create ticket",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: TicketFormValues) => {
    createTicketMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Open Support Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Provide details about your issue so our support team can help you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="support">General Support</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your issue in detail. Include steps to reproduce if applicable."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={createTicketMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}