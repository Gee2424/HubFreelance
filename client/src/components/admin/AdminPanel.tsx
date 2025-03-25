import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserWithoutPassword, UserRole, JobWithClient, ProposalWithFreelancer, ContractWithUsers, MessageWithUsers } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Briefcase, 
  FileCheck,
  UserCog,
  KeyRound,
  UserPlus,
  AlertTriangle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface RoleAssignmentDialogProps {
  user: UserWithoutPassword;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (userId: number, newRole: UserRole) => void;
}

function RoleAssignmentDialog({ user, open, onOpenChange, onRoleChange }: RoleAssignmentDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  
  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole);
  };
  
  const handleSubmit = () => {
    if (selectedRole !== user.role) {
      onRoleChange(user.id, selectedRole);
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Role to {user.username}</DialogTitle>
          <DialogDescription>
            Change the user's role to grant different permissions and access levels.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select 
              value={selectedRole} 
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Define validation schemas
const createUserSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters" }).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  role: z.enum(['client', 'freelancer', 'admin', 'support', 'qa', 'dispute_resolution', 'accounts'], {
    required_error: "Please select a role",
  }),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  generateRandom: z.boolean().default(true),
});

// Type definitions for the forms
type CreateUserFormValues = z.infer<typeof createUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface PasswordResetDialogProps {
  user: UserWithoutPassword;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordReset: (userId: number, data: ResetPasswordFormValues) => void;
}

function PasswordResetDialog({ user, open, onOpenChange, onPasswordReset }: PasswordResetDialogProps) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      generateRandom: true,
    },
  });

  function onSubmit(data: ResetPasswordFormValues) {
    onPasswordReset(user.id, data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset the password for {user.username}. You can either specify a new password or generate a random one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="generateRandom"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Generate Random Password</FormLabel>
                    <FormDescription>
                      System will create a secure random password
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="accent-primary h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {!form.watch("generateRandom") && (
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button type="submit">Reset Password</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (data: CreateUserFormValues) => void;
}

function CreateUserDialog({ open, onOpenChange, onCreateUser }: CreateUserDialogProps) {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      username: '',
      fullName: '',
      password: '',
      role: 'client',
    },
  });

  function onSubmit(data: CreateUserFormValues) {
    onCreateUser(data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account with the specified details. If no password is provided, a random one will be generated.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Leave blank to generate randomly" {...field} />
                  </FormControl>
                  <FormDescription>
                    If left blank, a secure random password will be generated
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="qa">QA</SelectItem>
                      <SelectItem value="dispute_resolution">Dispute Resolution</SelectItem>
                      <SelectItem value="accounts">Accounts</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = React.useState('users');
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Mutation to update user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: UserRole }) => {
      return await apiRequest<any>(
        `/api/admin/users/${userId}`,
        { 
          method: 'PATCH',
          body: JSON.stringify({ role })
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating role",
        description: error.message || "There was an error updating the user's role",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to reset user password
  const resetPassword = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: ResetPasswordFormValues }) => {
      return await apiRequest<any>(
        `/api/admin/users/${userId}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({
            newPassword: data.generateRandom ? undefined : data.newPassword
          })
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      if (data?.newPassword) {
        // Show the generated password to the admin
        toast({
          title: "Password reset successful",
          description: (
            <div className="mt-2">
              <p>A new password has been generated:</p>
              <code className="bg-muted p-2 mt-2 block rounded">{data.newPassword}</code>
              <p className="text-sm mt-2">Please copy this password as it won't be shown again.</p>
            </div>
          ),
          duration: 10000, // Extra time to copy the password
        });
      } else {
        toast({
          title: "Password reset successful",
          description: "User password has been reset.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error resetting password",
        description: error.message || "There was an error resetting the user's password",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to create a new user
  const createUser = useMutation({
    mutationFn: async (data: CreateUserFormValues) => {
      return await apiRequest<any>(
        `/api/admin/users`,
        {
          method: 'POST',
          body: JSON.stringify(data)
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      if (data?.generatedPassword) {
        // Show the generated password to the admin
        toast({
          title: "User created successfully",
          description: (
            <div className="mt-2">
              <p>User created with generated password:</p>
              <code className="bg-muted p-2 mt-2 block rounded">{data.generatedPassword}</code>
              <p className="text-sm mt-2">Please copy this password as it won't be shown again.</p>
            </div>
          ),
          duration: 10000, // Extra time to copy the password
        });
      } else {
        toast({
          title: "User created successfully",
          description: "New user account has been created.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message || "There was an error creating the user",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to toggle user active status
  const toggleUserActive = useMutation({
    mutationFn: async ({ userId, active }: { userId: number; active: boolean }) => {
      return await apiRequest<any>(
        `/api/admin/users/${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ active })
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: variables.active ? "User activated" : "User suspended",
        description: variables.active 
          ? "User account has been activated and can now access the platform" 
          : "User account has been suspended and can no longer access the platform",
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: variables.active ? "Error activating user" : "Error suspending user",
        description: error.message || "There was an error updating the user's status",
        variant: "destructive"
      });
    }
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Mock data for now - will be replaced with real API call
    initialData: [] as UserWithoutPassword[],
    enabled: activeTab === 'users',
  });

  // Fetch all jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/jobs'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Mock data for now - will be replaced with real API call
    initialData: [] as JobWithClient[],
    enabled: activeTab === 'jobs',
  });

  // Fetch all proposals
  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['/api/admin/proposals'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Mock data for now - will be replaced with real API call
    initialData: [] as ProposalWithFreelancer[],
    enabled: activeTab === 'proposals',
  });

  // Fetch all contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/admin/contracts'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Mock data for now - will be replaced with real API call
    initialData: [] as ContractWithUsers[],
    enabled: activeTab === 'contracts',
  });

  // Fetch reported messages or issues
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
    queryFn: getQueryFn({ on401: 'throw' }),
    // Mock data for now - will be replaced with real API call
    initialData: [] as MessageWithUsers[],
    enabled: activeTab === 'reports',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <Button 
          onClick={() => setIsCreateUserDialogOpen(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-100 p-3 rounded-lg">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{Array.isArray(users) ? users.length : 0}</p>
        </div>

        <div className="bg-green-100 p-3 rounded-lg ml-6">
          <Briefcase className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active Jobs</p>
          <p className="text-2xl font-bold">{Array.isArray(jobs) ? jobs.filter(job => job.status === 'open').length : 0}</p>
        </div>

        <div className="bg-amber-100 p-3 rounded-lg ml-6">
          <FileCheck className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active Contracts</p>
          <p className="text-2xl font-bold">{Array.isArray(contracts) ? contracts.filter(contract => contract.status === 'active').length : 0}</p>
        </div>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View, edit, or suspend user accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading users...</TableCell>
                    </TableRow>
                  ) : Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.fullName || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'admin' ? 'destructive' : 
                            user.role === 'client' ? 'default' : 
                            user.role === 'freelancer' ? 'secondary' :
                            user.role === 'support' ? 'outline' :
                            'default'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Role
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsPasswordResetDialogOpen(true);
                              }}
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                            <Button 
                              variant={user.active === false ? "secondary" : "destructive"} 
                              size="sm"
                              onClick={() => {
                                toggleUserActive.mutate({ 
                                  userId: user.id, 
                                  active: user.active === false 
                                });
                              }}
                            >
                              {user.active === false ? "Activate" : "Suspend"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>View and moderate job listings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading jobs...</TableCell>
                    </TableRow>
                  ) : Array.isArray(jobs) && jobs.length > 0 ? (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.id}</TableCell>
                        <TableCell>{job.title}</TableCell>
                        <TableCell>{job.client ? job.client.username : job.clientId}</TableCell>
                        <TableCell>
                          <Badge variant={
                            job.status === 'open' ? 'default' : 
                            job.status === 'in_progress' ? 'secondary' : 
                            job.status === 'completed' ? 'outline' : 
                            'destructive'
                          }>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            <Button variant="destructive" size="sm">Remove</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No jobs found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Management</CardTitle>
              <CardDescription>View and manage proposals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposalsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading proposals...</TableCell>
                    </TableRow>
                  ) : Array.isArray(proposals) && proposals.length > 0 ? (
                    proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>{proposal.id}</TableCell>
                        <TableCell>{proposal.freelancer ? proposal.freelancer.username : proposal.freelancerId}</TableCell>
                        <TableCell>{proposal.jobId}</TableCell>
                        <TableCell>
                          <Badge variant={
                            proposal.status === 'pending' ? 'default' : 
                            proposal.status === 'accepted' ? 'outline' : 
                            'destructive'
                          }>
                            {proposal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(proposal.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            <Button variant="secondary" size="sm">Resolve</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No proposals found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Management</CardTitle>
              <CardDescription>View and manage contracts between clients and freelancers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading contracts...</TableCell>
                    </TableRow>
                  ) : Array.isArray(contracts) && contracts.length > 0 ? (
                    contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{contract.id}</TableCell>
                        <TableCell>{contract.client ? contract.client.username : contract.clientId}</TableCell>
                        <TableCell>{contract.freelancer ? contract.freelancer.username : contract.freelancerId}</TableCell>
                        <TableCell>{contract.job ? contract.job.title.substring(0, 15) + '...' : contract.jobId}</TableCell>
                        <TableCell>
                          <Badge variant={
                            contract.status === 'active' ? 'default' : 
                            contract.status === 'completed' ? 'outline' : 
                            'destructive'
                          }>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            <Button variant="secondary" size="sm">Mediate</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No contracts found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Disputes</CardTitle>
              <CardDescription>Manage reported content and user disputes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading reports...</TableCell>
                    </TableRow>
                  ) : Array.isArray(reports) && reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id}</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>{report.sender ? report.sender.username : report.senderId}</TableCell>
                        <TableCell>{report.receiver ? report.receiver.username : report.receiverId}</TableCell>
                        <TableCell>
                          <Badge>Pending</Badge>
                        </TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            <Button variant="secondary" size="sm">Resolve</Button>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No reports found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Role Assignment Dialog */}
      {selectedUser && (
        <RoleAssignmentDialog
          user={selectedUser}
          open={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          onRoleChange={(userId, role) => {
            updateUserRole.mutate({ userId, role });
          }}
        />
      )}
      
      {/* Password Reset Dialog */}
      {selectedUser && (
        <PasswordResetDialog
          user={selectedUser}
          open={isPasswordResetDialogOpen}
          onOpenChange={setIsPasswordResetDialogOpen}
          onPasswordReset={(userId, data) => {
            resetPassword.mutate({ userId, data });
          }}
        />
      )}
      
      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateUserDialogOpen}
        onOpenChange={setIsCreateUserDialogOpen}
        onCreateUser={(data) => {
          createUser.mutate(data);
        }}
      />
    </div>
  );
}