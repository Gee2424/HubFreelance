import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletTransaction } from "@/types";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  CircleDollarSign,
  ExternalLink,
  Shield
} from "lucide-react";
import { parseISO, formatDistanceToNow } from 'date-fns';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Validation schema for deposit form
const depositSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive").min(1, "Minimum deposit is 1")
});

type DepositFormValues = z.infer<typeof depositSchema>;

export default function WalletIndex() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositMethod, setDepositMethod] = useState<"manual" | "pesapal">("manual");
  
  // Define balance response type
  interface WalletBalance {
    balance: number;
  }
  
  // Wallet balance query
  const walletQuery = useQuery<WalletBalance>({
    queryKey: ['/api/wallet/balance'],
    queryFn: ({ signal }) => apiRequest<WalletBalance>('/api/wallet/balance', { signal }),
    enabled: !!user
  });
  
  // Transactions query
  const transactionsQuery = useQuery<WalletTransaction[]>({
    queryKey: ['/api/wallet/transactions'],
    queryFn: ({ signal }) => apiRequest<WalletTransaction[]>('/api/wallet/transactions', { signal }),
    enabled: !!user
  });

  // Define response types
  type DepositResponse = {
    transaction?: { amount: number };
    paymentUrl?: string;
  };
  
  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: (values: DepositFormValues) => {
      if (depositMethod === "pesapal") {
        return apiRequest<DepositResponse>('/api/wallet/pesapal/initiate', {
          method: 'POST',
          body: JSON.stringify(values)
        });
      } else {
        return apiRequest<DepositResponse>('/api/wallet/deposit', {
          method: 'POST',
          body: JSON.stringify(values)
        });
      }
    },
    onSuccess: (data) => {
      if (depositMethod === "pesapal" && data.paymentUrl) {
        // For PesaPal, open payment URL in new window
        window.open(data.paymentUrl, '_blank');
        toast({
          title: "Payment Initiated",
          description: "Please complete your payment through PesaPal",
        });
      } else if (data.transaction) {
        toast({
          title: "Deposit Successful",
          description: `${data.transaction.amount} has been added to your wallet`,
        });
      }
      // Invalidate balance and transactions queries
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Form setup
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0
    }
  });

  // Submit handler
  const onSubmit = (values: DepositFormValues) => {
    depositMutation.mutate(values);
  };

  // Helper function to get transaction icon
  const getTransactionIcon = (transaction: WalletTransaction) => {
    switch (transaction.type) {
      case "deposit":
        return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case "withdrawal":
        return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case "escrow_hold":
        return <Shield className="w-5 h-5 text-blue-500" />;
      case "escrow_release":
        return <CircleDollarSign className="w-5 h-5 text-purple-500" />;
      default:
        return <CircleDollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  // Helper function to get transaction status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Error display */}
      {(walletQuery.isError || transactionsQuery.isError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-red-800">Connection Issues</h3>
            <p className="text-sm text-red-700 mt-1">
              There was a problem connecting to the server. Your wallet information might not be up-to-date.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-red-300 text-red-700 hover:bg-red-50" 
            onClick={() => {
              walletQuery.refetch();
              transactionsQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet balance card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your current available funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="text-4xl font-bold">
                {walletQuery.isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-10 w-28 rounded"></div>
                ) : (
                  <span>${walletQuery.data?.balance ?? 0}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Add Funds</CardTitle>
            <CardDescription>Deposit money to your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual" onValueChange={(v) => setDepositMethod(v as "manual" | "pesapal")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Deposit</TabsTrigger>
                <TabsTrigger value="pesapal">PesaPal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="py-4">
                <p className="text-sm text-gray-500 mb-4">
                  This is a test deposit option. In a real application, this would be replaced with actual payment methods.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter amount" 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the amount you want to deposit to your wallet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={depositMutation.isPending || walletQuery.isError}
                    >
                      {depositMutation.isPending ? "Processing..." : "Deposit Funds"}
                    </Button>
                    {depositMutation.isError && (
                      <p className="text-sm text-red-500 mt-2">
                        {(depositMutation.error as any)?.message || "Failed to process deposit. Please try again."}
                      </p>
                    )}
                    {walletQuery.isError && (
                      <p className="text-sm text-red-500 mt-2">
                        Connection issues detected. Deposits may not process correctly.
                      </p>
                    )}
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="pesapal" className="py-4">
                <p className="text-sm text-gray-500 mb-4">
                  PesaPal integration allows you to deposit funds via M-Pesa, credit cards, and other payment methods.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter amount" 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the amount you want to deposit via PesaPal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full flex items-center justify-center gap-2" 
                      disabled={depositMutation.isPending || walletQuery.isError}
                    >
                      {depositMutation.isPending ? "Processing..." : "Proceed to PesaPal"}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {depositMutation.isError && (
                      <p className="text-sm text-red-500 mt-2">
                        {(depositMutation.error as any)?.message || "Failed to process deposit. Please try again."}
                      </p>
                    )}
                    {walletQuery.isError && (
                      <p className="text-sm text-red-500 mt-2">
                        Connection issues detected. Deposits may not process correctly.
                      </p>
                    )}
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent activities in your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-3 border rounded-md">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : !transactionsQuery.data || !Array.isArray(transactionsQuery.data) || transactionsQuery.data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactionsQuery.data.map((transaction: WalletTransaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <div className="font-medium">{transaction.description || "Transaction"}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        {getStatusIcon(transaction.status)} 
                        <span>{transaction.status}</span> • 
                        <span>{formatDate(transaction.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}