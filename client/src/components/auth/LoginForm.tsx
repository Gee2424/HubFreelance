
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  async function onSubmit(values: LoginFormValues) {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
      // The AuthContext will handle redirection and success message
    } catch (error: any) {
      // Error handling is done in AuthContext, but we'll add a fallback
      if (!error.handled) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error?.message || "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to your FreelanceHub account</p>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">Test Accounts:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-white rounded border border-gray-200">
            <p className="font-medium">Admin</p>
            <p>admin@example.com</p>
            <p>password123</p>
          </div>
          <div className="p-2 bg-white rounded border border-gray-200">
            <p className="font-medium">Client</p>
            <p>client@example.com</p>
            <p>password123</p>
          </div>
          <div className="p-2 bg-white rounded border border-gray-200">
            <p className="font-medium">Freelancer</p>
            <p>freelancer@example.com</p>
            <p>password123</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
