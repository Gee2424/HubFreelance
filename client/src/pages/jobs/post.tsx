import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { insertJobSchema } from "@shared/schema";

// Extend the job schema with additional validation
const jobFormSchema = insertJobSchema.extend({
  title: z.string().min(10, {
    message: "Title must be at least 10 characters long",
  }).max(100, {
    message: "Title must not exceed 100 characters",
  }),
  description: z.string().min(30, {
    message: "Description must be at least 30 characters long",
  }),
  category: z.string({
    required_error: "Please select a category",
  }),
  skills: z.array(z.string()).min(1, {
    message: "Please enter at least one skill",
  }),
  budget: z.union([
    z.string().optional(),
    z.number().optional()
  ]),
  hourlyRate: z.union([
    z.string().optional(),
    z.number().optional()
  ]),
  deadlineDate: z.union([
    z.string().optional(),
    z.date().optional()
  ]),
}).refine(data => {
  // Check if either budget or hourlyRate has a value
  return (data.budget !== undefined && data.budget !== "") || 
         (data.hourlyRate !== undefined && data.hourlyRate !== "");
}, {
  message: "Please provide either a fixed budget or an hourly rate",
  path: ["budget"],
});

// Form values type with potential string inputs that need conversion
type JobFormValues = {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget?: string;
  hourlyRate?: string;
  deadlineDate?: string;
};

// Available job categories
const JOB_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Design & Creative",
  "Writing & Translation",
  "Marketing & SEO",
  "IT & Networking",
  "Data Science & Analytics",
  "Finance & Accounting",
  "Administrative & Support",
  "Customer Service",
  "Other",
];

export default function JobPost() {
  const { isClient } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      skills: [],
      budget: "",
      hourlyRate: "",
    },
  });
  
  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      // Convert string inputs to appropriate types
      const jobData = {
        ...values,
        budget: values.budget ? parseInt(values.budget) : undefined,
        hourlyRate: values.hourlyRate ? parseFloat(values.hourlyRate) : undefined,
        deadlineDate: values.deadlineDate ? new Date(values.deadlineDate) : undefined,
      };
      
      return await apiRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify(jobData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Job posted successfully",
        description: "Your job has been posted and is now visible to freelancers.",
      });
      
      // Invalidate jobs cache to update lists
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      
      // Navigate to the new job's page
      navigate(`/jobs/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post job",
        description: error.message || "Please check the form and try again.",
        variant: "destructive",
      });
    },
  });
  
  // If not a client, show an error
  if (!isClient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">Only clients can post jobs.</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }
  
  // Handle form submission
  const onSubmit = (values: JobFormValues) => {
    createJobMutation.mutate(values);
  };
  
  // Handle skills input (comma-separated)
  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If empty, set to empty array
    if (!value.trim()) {
      form.setValue("skills", []);
      return;
    }
    
    // Split by commas and trim whitespace
    const skills = value.split(",").map(skill => skill.trim()).filter(Boolean);
    form.setValue("skills", skills);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior React Developer for E-commerce Platform" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title will attract more qualified freelancers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the job requirements, deliverables, and any specific qualifications needed..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be detailed about your expectations, timeline, and required skills.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {JOB_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., JavaScript, React, Redux, GraphQL"
                      value={field.value.join(", ")}
                      onChange={handleSkillsChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter skills separated by commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixed Budget (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty if you prefer hourly rate.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 25.50"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty if you prefer fixed budget.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="deadlineDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    When do you need this project completed by?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => navigate("/jobs")}
                disabled={createJobMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting Job...
                  </>
                ) : (
                  "Post Job"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
