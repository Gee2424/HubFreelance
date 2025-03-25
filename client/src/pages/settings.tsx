import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema definitions
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  messageNotifications: z.boolean().default(true),
  proposalNotifications: z.boolean().default(true),
  contractNotifications: z.boolean().default(true),
  marketingNotifications: z.boolean().default(false),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const supabaseSchema = z.object({
  supabaseUrl: z.string().url("Please enter a valid Supabase URL"),
  supabaseAnonKey: z.string().min(1, "Supabase Anon Key is required"),
  supabaseServiceKey: z.string().min(1, "Supabase Service Key is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;
type SupabaseFormValues = z.infer<typeof supabaseSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [supabaseStatus, setSupabaseStatus] = useState<{
    storageType: 'supabase' | 'memory';
    supabaseConfigured: boolean;
    databaseAvailable: boolean;
  } | null>(null);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);

  // Fetch Supabase status on mount
  useEffect(() => {
    const fetchSupabaseStatus = async () => {
      try {
        const response = await fetch('/api/setup/status');
        if (response.ok) {
          const data = await response.json();
          setSupabaseStatus(data);
        } else {
          console.error('Failed to fetch Supabase status');
        }
      } catch (error) {
        console.error('Error fetching Supabase status:', error);
      }
    };
    
    fetchSupabaseStatus();
  }, []);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      location: user?.location || "",
      avatar: user?.avatar || "",
      skills: user?.skills || [],
      hourlyRate: user?.hourlyRate || undefined,
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      messageNotifications: true,
      proposalNotifications: true,
      contractNotifications: true,
      marketingNotifications: false,
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const supabaseForm = useForm<SupabaseFormValues>({
    resolver: zodResolver(supabaseSchema),
    defaultValues: {
      supabaseUrl: "",
      supabaseAnonKey: "",
      supabaseServiceKey: "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) return null;
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateNotifications = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      if (!user) return null;
      const response = await apiRequest("PATCH", `/api/users/${user.id}/notifications`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update notification settings",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateSecurity = useMutation({
    mutationFn: async (data: SecurityFormValues) => {
      if (!user) return null;
      const response = await apiRequest("POST", `/api/auth/change-password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      securityForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change password",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const configureSupabase = useMutation({
    mutationFn: async (data: SupabaseFormValues) => {
      setIsLoadingSupabase(true);
      try {
        const response = await fetch('/api/setup/supabase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to configure Supabase');
        }

        return await response.json();
      } finally {
        setIsLoadingSupabase(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Supabase Configured Successfully",
        description: "The application will use Supabase for storage. Restarting server...",
      });
      
      // Reload the application to use the new storage implementation
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Configure Supabase",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <div className="container py-6">Please log in to view settings.</div>;
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(data => updateProfile.mutate(data))} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(data => updateNotifications.mutate(data))} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel>Email Notifications</FormLabel>
                          <FormDescription>Receive updates via email</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateNotifications.isPending}>
                    {updateNotifications.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(data => updateSecurity.mutate(data))} className="space-y-4">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateSecurity.isPending}>
                    {updateSecurity.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>Configure Supabase as your database provider</CardDescription>
            </CardHeader>
            <CardContent>
              {supabaseStatus && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-md font-medium">Current Status:</h3>
                    <Badge variant={supabaseStatus.databaseAvailable ? "default" : "outline"}>
                      {supabaseStatus.storageType === 'supabase' ? 'Supabase' : 'In-Memory Storage'}
                    </Badge>
                    {supabaseStatus.databaseAvailable && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Connected
                      </Badge>
                    )}
                  </div>
                  
                  {supabaseStatus.storageType === 'memory' && (
                    <Alert className="mb-4">
                      <AlertTitle>Using In-Memory Storage</AlertTitle>
                      <AlertDescription>
                        Your application is currently using in-memory storage. Data will be lost when the server restarts.
                        Configure Supabase below to enable persistent storage.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              <Form {...supabaseForm}>
                <form onSubmit={supabaseForm.handleSubmit(data => configureSupabase.mutate(data))} className="space-y-4">
                  <FormField
                    control={supabaseForm.control}
                    name="supabaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supabase URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-project.supabase.co" {...field} />
                        </FormControl>
                        <FormDescription>
                          The URL of your Supabase project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={supabaseForm.control}
                    name="supabaseAnonKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supabase Anon Key</FormLabel>
                        <FormControl>
                          <Input placeholder="eyJhbGciOiJIUzI1NiIsI..." {...field} />
                        </FormControl>
                        <FormDescription>
                          The anonymous key for your Supabase project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={supabaseForm.control}
                    name="supabaseServiceKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supabase Service Key</FormLabel>
                        <FormControl>
                          <Input placeholder="eyJhbGciOiJIUzI1NiIsI..." {...field} />
                        </FormControl>
                        <FormDescription>
                          The service role key for your Supabase project (with full access)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoadingSupabase || configureSupabase.isPending}
                    className="mt-4"
                  >
                    {(isLoadingSupabase || configureSupabase.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configuring...
                      </>
                    ) : (
                      "Configure Supabase"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}