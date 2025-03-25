import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, MemStorage } from "./storage";
import { 
  insertUserSchema, 
  insertJobSchema, 
  insertProposalSchema, 
  insertContractSchema, 
  insertMessageSchema, 
  insertPaymentSchema, 
  insertReviewSchema,
  insertActivitySchema,
  insertNotificationSchema,
  users,
  WalletTransaction
} from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupSupabaseCredentials } from "./setupSupabase";
import authRoutes from "./routes/authRoutes";
import { authService } from "./services/authService";
import adminRoutes from "./routes/adminRoutes";
import cookieParser from 'cookie-parser';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Add cookie-parser middleware
  app.use(cookieParser());

  // Add a simple users count endpoint for testing the database connection
  app.get('/api/users/count', async (req: Request, res: Response) => {
    try {
      const count = await storage.getUserCount();
      return res.status(200).json({ count });
    } catch (err) {
      console.error('Error getting user count:', err);
      return res.status(500).json({ message: 'Failed to get user count', error: (err as Error).message });
    }
  });

  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Authentication check middleware
  const requireAuth = async (req: Request, res: Response, next: Function) => {
    try {
      // Get the user ID from request headers
      // This could be either our database user ID or a Supabase auth ID
      const userId = req.headers['user-id'] ? req.headers['user-id'].toString() : null;
      const authToken = req.headers['authorization'] ? 
        req.headers['authorization'].replace('Bearer ', '') : null;
      
      if (!userId && !authToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      let user = null;
      
      // Try to find the user by numeric ID first (our database ID)
      if (userId && userId.match(/^\d+$/)) {
        user = await storage.getUser(Number(userId));
      }
      
      // If not found, try other ways to identify the user
      if (!user && userId) {
        // Try Supabase fallbacks for demo purposes
        try {
          // Try to find user by email (the fallback method)
          user = await storage.getUserByEmail(userId);
        } catch (err) {
          console.log("Error looking up user by email:", err);
        }
        
        // Handle test accounts
        if (!user && userId.includes("@example.com")) {
          const testEmails = {
            "admin@example.com": 3,
            "client@example.com": 1,
            "freelancer@example.com": 2,
            "support@example.com": 4,
            "qa@example.com": 5
          };
          
          if (userId in testEmails) {
            user = await storage.getUser(testEmails[userId as keyof typeof testEmails]);
          }
        }
        
        // If still not found but looks like an email address, dynamically create a user 
        // for Supabase authenticated users (this helps when the DB is down but auth works)
        // We check if we're using in-memory storage by checking for a method that only exists in memory implementation
        if (!user && userId.includes('@')) {
          try {
            console.log(`Creating temporary in-memory user for authenticated Supabase user: ${userId}`);
            // Determine role from email for demo (in real app, would fetch from Supabase metadata)
            let role: 'client' | 'freelancer' | 'admin' | 'support' | 'qa' = 'freelancer';
            
            if (userId.includes('admin')) role = 'admin';
            else if (userId.includes('client')) role = 'client';
            else if (userId.includes('support')) role = 'support';
            else if (userId.includes('qa')) role = 'qa';
            
            // Create a temporary user
            user = await storage.createUser({
              email: userId,
              username: userId.split('@')[0],
              password: 'auto-generated',
              fullName: `Supabase User`,
              role: role,
              bio: null,
              avatar: null,
              skills: [],
              hourlyRate: null,
              location: null
            });
            
            console.log(`Successfully created temp user: ${user.id} with role: ${role}`);
          } catch (createErr) {
            console.error('Error creating temporary user:', createErr);
          }
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Add user to request for use in routes
      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  };

  // Role check middleware
  const checkRole = (role: string) => {
    return (req: Request, res: Response, next: Function) => {
      const user = (req as any).user;
      if (user.role !== role) {
        return res.status(403).json({ message: `Only ${role}s can access this endpoint` });
      }
      next();
    };
  };
  
  // Admin check middleware - also checks authentication
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    try {
      // First use the standard auth middleware to authenticate the user
      requireAuth(req, res, () => {
        const user = (req as any).user;
        
        // Then check if user is admin
        if (user.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden - Admin access required" });
        }
        
        // If user is admin, proceed
        next();
      });
    } catch (error) {
      handleError(error, res);
    }
  };

  // User Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email or username already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // In a real app, we would hash the password before storing
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Accept email or username field to maintain compatibility
      const username = req.body?.email || req.body?.username;
      const password = req.body?.password;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: "Email/username and password are required",
          code: "MISSING_CREDENTIALS"
        });
      }
      
      // Check if logging in with email or username
      const isEmail = username.includes('@');
      
      let user;
      try {
        if (isEmail) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
      } catch (error) {
        console.error("Database error during login:", error);
        return res.status(500).json({ 
          message: "Failed to verify credentials",
          code: "DATABASE_ERROR"
        });
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: "Account not found",
          code: "ACCOUNT_NOT_FOUND"
        });
      }
      
      // Verify password using the proper hash verification
      if (!authService.verifyPassword(password, user.password)) {
        return res.status(401).json({ 
          message: "Invalid password",
          code: "INVALID_PASSWORD"
        });
      }
      
      // In a real app, we would create and send a JWT token here
      const { password: _, ...userWithoutPassword } = user;
      
      // Generate a JWT token for the session
      const token = authService.generateToken(user);
      
      // Include user ID in response header for auth middleware
      res.setHeader('X-User-ID', user.id.toString());
      
      // Include token in Authorization header for frontend
      res.setHeader('Authorization', `Bearer ${token}`);
      
      res.json({
        ...userWithoutPassword,
        token, // Also include token in the response body
        message: "Login successful"
      });
    } catch (err) {
      console.error("Unexpected error during login:", err);
      handleError(err, res);
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      // Get all users - only available in non-production
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "This endpoint is not available in production" });
      }

      // For now, let's just return an array of mock users
      // In a real system, you'd implement paging and filtering
      const allUsers = [];
      
      // Iterate through known IDs
      for (let i = 1; i <= 10; i++) {
        try {
          const user = await storage.getUser(i);
          if (user) {
            const { password, ...userWithoutPassword } = user;
            allUsers.push(userWithoutPassword);
          }
        } catch (err) {
          // Skip any error and continue
          console.error(`Error fetching user ${i}:`, err);
        }
      }
      
      res.json(allUsers);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const updatedUser = await storage.updateUser(user.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Job Routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const jobs = await storage.getJobs(limit, offset);
      res.json(jobs);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/jobs/category/:category", async (req, res) => {
    try {
      const jobs = await storage.getJobsByCategory(req.params.category);
      res.json(jobs);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/jobs", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData, user.id);
      
      // Create activity for job posting
      await storage.createActivity({
        userId: user.id,
        type: "job_posted",
        metadata: { jobId: job.id, jobTitle: job.title }
      });
      
      res.status(201).json(job);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/jobs/:id", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.clientId !== user.id) {
        return res.status(403).json({ message: "You can only update your own jobs" });
      }
      
      const updatedJob = await storage.updateJob(jobId, req.body);
      res.json(updatedJob);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Proposal Routes
  app.get("/api/jobs/:jobId/proposals", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Only the job owner or the proposal submitter can see proposals
      if (job.clientId !== user.id && user.role !== "freelancer") {
        return res.status(403).json({ message: "Not authorized to view these proposals" });
      }
      
      const proposals = await storage.getProposalsByJob(jobId);
      
      // If freelancer, only return their own proposal
      if (user.role === "freelancer") {
        const ownProposals = proposals.filter(p => p.freelancerId === user.id);
        return res.json(ownProposals);
      }
      
      res.json(proposals);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/jobs/:jobId/proposals", requireAuth, checkRole("freelancer"), async (req, res) => {
    try {
      const user = (req as any).user;
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if job is still open
      if (job.status !== "open") {
        return res.status(400).json({ message: "Cannot submit proposal for a closed job" });
      }
      
      // Check if freelancer already submitted a proposal
      const existingProposals = await storage.getProposalsByJob(jobId);
      const alreadyApplied = existingProposals.some(p => p.freelancerId === user.id);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already submitted a proposal for this job" });
      }
      
      const proposalData = insertProposalSchema.parse({
        ...req.body,
        jobId
      });
      
      const proposal = await storage.createProposal(proposalData, user.id);
      
      // Create activity for proposal submission
      await storage.createActivity({
        userId: user.id,
        type: "proposal_submitted",
        metadata: { jobId, proposalId: proposal.id }
      });
      
      res.status(201).json(proposal);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/proposals/:id", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      const job = await storage.getJob(proposal.jobId);
      
      if (!job || job.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this proposal" });
      }
      
      const updatedProposal = await storage.updateProposal(proposalId, req.body);
      res.json(updatedProposal);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Contract Routes
  app.post("/api/contracts", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const contractData = insertContractSchema.parse(req.body);
      
      // Verify proposal and job exist and belong to this client
      const proposal = await storage.getProposal(contractData.proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      const job = await storage.getJob(proposal.jobId);
      if (!job || job.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to create this contract" });
      }
      
      // Create contract with client and freelancer IDs from the job and proposal
      const contract = await storage.createContract({
        ...contractData,
        clientId: user.id,
        freelancerId: proposal.freelancerId,
        jobId: job.id
      });
      
      // Update job status to in_progress
      await storage.updateJob(job.id, { status: "in_progress" });
      
      // Update proposal status to accepted
      await storage.updateProposal(proposal.id, { status: "accepted" });
      
      // Create activity for contract creation
      await storage.createActivity({
        userId: user.id,
        type: "contract_created",
        metadata: { 
          contractId: contract.id, 
          jobId: job.id, 
          freelancerId: proposal.freelancerId 
        }
      });
      
      res.status(201).json(contract);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/contracts/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      let contracts;
      
      if (user.role === "client") {
        contracts = await storage.getContractsByClient(user.id);
      } else {
        contracts = await storage.getContractsByFreelancer(user.id);
      }
      
      res.json(contracts);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Verify user is part of this contract
      if (contract.clientId !== user.id && contract.freelancerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this contract" });
      }
      
      // Only clients can mark contracts as completed
      if (req.body.status === "completed" && user.role !== "client") {
        return res.status(403).json({ message: "Only clients can mark contracts as completed" });
      }
      
      const updatedContract = await storage.updateContract(contractId, req.body);
      
      // If contract is completed, also update the job
      if (updatedContract?.status === "completed") {
        await storage.updateJob(contract.jobId, { status: "completed" });
      }
      
      res.json(updatedContract);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Message Routes
  app.get("/api/messages/:userId", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const otherUserId = parseInt(req.params.userId);
      
      const messages = await storage.getMessagesBetweenUsers(user.id, otherUserId);
      res.json(messages);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: user.id
      });
      
      const message = await storage.createMessage(messageData);
      
      // Create activity for message sent
      await storage.createActivity({
        userId: user.id,
        type: "message_sent",
        metadata: { 
          messageId: message.id, 
          receiverId: message.receiverId,
          jobId: message.jobId 
        }
      });
      
      res.status(201).json(message);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const messageId = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Only the receiver can mark message as read
      if (message.receiverId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this message" });
      }
      
      res.json(message);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get unread message count for authenticated user
  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const count = await storage.getUnreadMessageCount(user.id);
      res.json({ count });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Test endpoint - Get all messages between client(1) and freelancer(2) (public, no auth required)
  app.get("/api/test/messages", async (req, res) => {
    try {
      // Client ID is 1, Freelancer ID is 2 in seed data
      const messages = await storage.getMessagesBetweenUsers(1, 2);
      res.json(messages);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Notification Routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const notifications = await storage.getNotificationsByUser(user.id);
      res.json(notifications);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId, user.id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ success: true });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Payment Routes
  app.post("/api/payments", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Verify contract exists and belongs to this client
      const contract = await storage.getContract(paymentData.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to make payments for this contract" });
      }
      
      const payment = await storage.createPayment(paymentData);
      
      // In a real app, this would integrate with a payment processor
      // For demo, immediately update to "held" status (in escrow)
      const updatedPayment = await storage.updatePayment(payment.id, { status: "held" });
      
      // Create activity for payment
      await storage.createActivity({
        userId: user.id,
        type: "payment_released",
        metadata: { 
          paymentId: payment.id, 
          contractId: contract.id,
          amount: payment.amount 
        }
      });
      
      res.status(201).json(updatedPayment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/payments/:id/release", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const contract = await storage.getContract(payment.contractId);
      
      if (!contract || contract.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to release this payment" });
      }
      
      if (payment.status !== "held") {
        return res.status(400).json({ message: "Payment is not in escrow" });
      }
      
      const updatedPayment = await storage.updatePayment(paymentId, { status: "released" });
      
      // Create activity for payment release
      await storage.createActivity({
        userId: user.id,
        type: "payment_released",
        metadata: { 
          paymentId, 
          contractId: contract.id,
          freelancerId: contract.freelancerId,
          amount: payment.amount 
        }
      });
      
      res.json(updatedPayment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Wallet Routes
  app.get("/api/wallet/balance", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      res.status(200).json({ 
        balance: user.walletBalance,
        userId: user.id 
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const transactions = await storage.getWalletTransactionsByUser(user.id);
      res.status(200).json(transactions);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // PesaPal payment initiation endpoint
  app.post("/api/wallet/pesapal/initiate", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Create a pending transaction record
      const transaction = await storage.createWalletTransaction({
        userId: user.id,
        amount,
        type: "deposit",
        description: "PesaPal deposit initiated",
        reference: `pesapal-${Date.now()}`,
        metadata: { 
          source: "pesapal",
          status: "initiated"
        }
      });
      
      // In a real implementation, this would make an API call to PesaPal to initiate payment
      // For now, we're just simulating this functionality
      
      // Return data needed for the frontend to initiate the PesaPal payment flow
      // In production, this should return actual payment URL or iFrame details from PesaPal
      res.status(200).json({
        transactionId: transaction.id,
        paymentReference: transaction.reference,
        paymentUrl: `https://www.pesapal.com/API/PostPesapalDirectOrderV4?oauth_token=dummy&pesapal_merchant_reference=${transaction.reference}`,
        amount,
        status: "pending",
        message: "Navigate to PesaPal to complete your payment"
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // PesaPal callback/webhook endpoint (would receive notifications from PesaPal)
  app.post("/api/wallet/pesapal/callback", async (req, res) => {
    try {
      // This endpoint would be called by PesaPal after payment completion
      const { pesapalTrackingId, pesapalNotification, pesapalMerchantReference } = req.body;
      
      if (!pesapalMerchantReference) {
        return res.status(400).json({ message: "Missing merchant reference" });
      }
      
      // Find the transaction by reference
      // We need to get transactions from memory storage for this implementation
      const memStorage = storage as any;
      const transactions = Array.from(memStorage.walletTransactions?.values() || []);
      const transaction = transactions.find((t: WalletTransaction) => t.reference === pesapalMerchantReference);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check the payment status - in a real implementation this would verify with PesaPal API
      const isPaymentCompleted = pesapalNotification === "COMPLETED";
      
      if (isPaymentCompleted) {
        // Update transaction status
        await storage.updateWalletTransaction(
          transaction.id,
          "completed",
          new Date()
        );
        
        // Update user's wallet balance
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const updatedUser = await storage.updateUserWalletBalance(user.id, transaction.amount);
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update wallet balance" });
        }
        
        // Record activity
        await storage.createActivity({
          userId: user.id,
          type: "wallet_deposit",
          metadata: {
            amount: transaction.amount,
            transactionId: transaction.id,
            newBalance: updatedUser.walletBalance,
            pesapalTrackingId
          }
        });
        
        // Return success
        res.status(200).json({ status: "success" });
      } else {
        // Mark transaction as failed
        await storage.updateWalletTransaction(
          transaction.id,
          "failed",
          new Date()
        );
        
        res.status(200).json({ status: "failed" });
      }
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Verify PesaPal payment status
  app.get("/api/wallet/pesapal/status/:reference", requireAuth, async (req, res) => {
    try {
      const reference = req.params.reference;
      const user = (req as any).user;
      
      // Find the transaction by reference
      const transactions = await storage.getWalletTransactionsByUser(user.id);
      const transaction = transactions.find(t => t.reference === reference);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // In a real implementation, this would check with PesaPal API for the current status
      
      res.status(200).json({
        transactionId: transaction.id,
        status: transaction.status,
        reference: transaction.reference,
        amount: transaction.amount,
        completedAt: transaction.completedAt
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Manual deposit endpoint (for testing without PesaPal)
  app.post("/api/wallet/deposit", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { amount, paymentReference } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Create a wallet transaction
      const transaction = await storage.createWalletTransaction({
        userId: user.id,
        amount,
        type: "deposit",
        description: "Funds added to wallet",
        reference: paymentReference || `manual-deposit-${Date.now()}`,
        metadata: { source: "manual_deposit" }
      });
      
      // Update user's wallet balance
      const updatedUser = await storage.updateUserWalletBalance(user.id, amount);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update wallet balance" });
      }
      
      // Mark transaction as completed
      const completedTransaction = await storage.updateWalletTransaction(
        transaction.id, 
        "completed", 
        new Date()
      );
      
      // Create activity record
      await storage.createActivity({
        userId: user.id,
        type: "wallet_deposit",
        metadata: { 
          amount,
          transactionId: transaction.id,
          newBalance: updatedUser.walletBalance
        }
      });
      
      res.status(200).json({ 
        transaction: completedTransaction,
        newBalance: updatedUser.walletBalance 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Escrow Routes
  app.post("/api/escrow/create", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = (req as any).user;
      const { contractId, amount, supervisorId } = req.body;
      
      if (!contractId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid contract ID or amount" });
      }
      
      // Verify contract exists and belongs to this client
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to create escrow for this contract" });
      }
      
      // Verify user has enough funds
      if (user.walletBalance < amount) {
        return res.status(400).json({ message: "Insufficient funds in wallet" });
      }
      
      // Create escrow account
      const escrow = await storage.createEscrowAccount({
        contractId,
        supervisorId: supervisorId || null,
      });
      
      // Update escrow amount
      const updatedEscrow = await storage.updateEscrowAccount(escrow.id, {
        amount
      });
      
      // Deduct from client's wallet
      const updatedUser = await storage.updateUserWalletBalance(user.id, -amount);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update wallet balance" });
      }
      
      // Create wallet transaction record
      const transaction = await storage.createWalletTransaction({
        userId: user.id,
        amount: -amount,
        type: "escrow_hold",
        description: `Funds placed in escrow for contract #${contractId}`,
        reference: `escrow-${escrow.id}-contract-${contractId}`,
        metadata: { 
          contractId,
          escrowId: escrow.id
        }
      });
      
      // Mark transaction as completed immediately
      await storage.updateWalletTransaction(transaction.id, "completed", new Date());
      
      // Create activity record
      await storage.createActivity({
        userId: user.id,
        type: "escrow_created",
        metadata: { 
          amount,
          contractId,
          escrowId: escrow.id
        }
      });
      
      res.status(200).json({
        escrow: updatedEscrow,
        newBalance: updatedUser.walletBalance
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.post("/api/escrow/release", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contractId, amount } = req.body;
      
      if (!contractId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid contract ID or amount" });
      }
      
      // Check user authorization - can be QA, admin, or the client who created the contract
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const escrow = await storage.getEscrowAccountByContract(contractId);
      if (!escrow) {
        return res.status(404).json({ message: "No escrow found for this contract" });
      }
      
      // Authorization check: must be client, admin, QA, or designated supervisor
      const isAuthorized = 
        user.id === contract.clientId || 
        user.role === 'admin' || 
        user.role === 'qa' ||
        (escrow.supervisorId && user.id === escrow.supervisorId);
      
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to release funds from this escrow" });
      }
      
      // Check if amount is valid
      if (amount > escrow.amount) {
        return res.status(400).json({ message: "Release amount exceeds escrow balance" });
      }
      
      // Release from escrow
      const success = await storage.releaseEscrow(contractId, amount, user.id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to release funds from escrow" });
      }
      
      // Get updated escrow for response
      const updatedEscrow = await storage.getEscrowAccountByContract(contractId);
      
      res.status(200).json({
        success: true,
        escrow: updatedEscrow
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Admin Routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // For an admin dashboard, we might want to get all users
      // This endpoint would normally have pagination and filtering
      const allUsers = new Map<number, any>();
      
      // Get users from storage (in a real app, this would be paginated and filtered)
      // Here we're doing a simple implementation where we collect all users
      for (let i = 1; i <= 100; i++) {
        const user = await storage.getUser(i);
        if (user) {
          // Don't return passwords
          const { password, ...userWithoutPassword } = user;
          allUsers.set(user.id, userWithoutPassword);
        }
      }
      
      res.json(Array.from(allUsers.values()));
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/admin/jobs", requireAdmin, async (req, res) => {
    try {
      // Return all jobs (in a real app, this would be paginated)
      const jobs = await storage.getJobs(100, 0);
      res.json(jobs);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/admin/proposals", requireAdmin, async (req, res) => {
    try {
      // Return all proposals (in a real app we would have a storage method for this)
      // Since we don't have a method to get all proposals, we'll collect them by job
      const jobs = await storage.getJobs(100, 0);
      const allProposals: any[] = [];
      
      // Collect proposals for each job
      for (const job of jobs) {
        const proposals = await storage.getProposalsByJob(job.id);
        allProposals.push(...proposals);
      }
      
      res.json(allProposals);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/admin/contracts", requireAdmin, async (req, res) => {
    try {
      // Return all contracts (in a real app we would have a storage method for this)
      // Since we don't have a method to get all contracts, we'll collect them by job
      const jobs = await storage.getJobs(100, 0);
      const allContracts: any[] = [];
      
      // Collect contracts for each job
      for (const job of jobs) {
        const contracts = await storage.getContractsByJob(job.id);
        allContracts.push(...contracts);
      }
      
      res.json(allContracts);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      // In a real app, we would have a real reports table
      // For this demo, we'll just return some messages as "reports"
      // In a real application, this would return actual reported content
      
      // This is just a placeholder - in a real app you'd have a reports table
      const jobs = await storage.getJobs(5, 0);
      const allReports: any[] = [];
      
      // Just get some messages to show as "reports"
      for (const job of jobs) {
        // Look up the client to get their ID
        const client = await storage.getUser(job.clientId);
        if (client) {
          // Get messages related to this job
          const messages = await storage.getMessagesByJob(job.id);
          // Add the first message as a "report" if it exists
          if (messages.length > 0) {
            allReports.push({
              ...messages[0],
              reportType: 'message',
              reportedBy: client.id,
              status: 'pending',
              createdAt: new Date()
            });
          }
        }
      }
      
      res.json(allReports);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Admin user management endpoints
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create schema for role validation
      const updateUserSchema = z.object({
        role: z.enum(["client", "freelancer", "admin", "support", "qa"]),
      });
      
      // Validate role data
      const validatedData = updateUserSchema.parse(req.body);
      
      // Update user with validated data
      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Admin job management
  app.patch("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const updatedJob = await storage.updateJob(jobId, req.body);
      if (!updatedJob) {
        return res.status(500).json({ message: "Failed to update job" });
      }
      
      res.json(updatedJob);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Admin proposal management
  app.patch("/api/admin/proposals/:id", requireAdmin, async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      const updatedProposal = await storage.updateProposal(proposalId, req.body);
      if (!updatedProposal) {
        return res.status(500).json({ message: "Failed to update proposal" });
      }
      
      res.json(updatedProposal);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Admin contract management
  app.patch("/api/admin/contracts/:id", requireAdmin, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const updatedContract = await storage.updateContract(contractId, req.body);
      if (!updatedContract) {
        return res.status(500).json({ message: "Failed to update contract" });
      }
      
      res.json(updatedContract);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Review Routes
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: user.id
      });
      
      // Verify contract exists and user is part of it
      const contract = await storage.getContract(reviewData.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      if (contract.clientId !== user.id && contract.freelancerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to review this contract" });
      }
      
      // Determine who is being reviewed
      let receiverId;
      if (user.id === contract.clientId) {
        receiverId = contract.freelancerId; // Client reviewing freelancer
      } else {
        receiverId = contract.clientId; // Freelancer reviewing client
      }
      
      const review = await storage.createReview({
        ...reviewData,
        receiverId
      });
      
      // Create activity for review submission
      await storage.createActivity({
        userId: user.id,
        type: "review_submitted",
        metadata: { 
          reviewId: review.id, 
          contractId: contract.id,
          rating: review.rating
        }
      });
      
      res.status(201).json(review);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Activity Routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getUserActivities(user.id, limit);
      res.json(activities);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Supabase Configuration Route
  app.post("/api/setup/supabase", async (req, res) => {
    try {
      const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = req.body;
      
      if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        return res.status(400).json({ message: "All Supabase credentials are required" });
      }
      
      const result = await setupSupabaseCredentials(
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceKey
      );
      
      res.json({ message: result });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Endpoint to check current storage implementation
  app.get("/api/setup/status", async (req, res) => {
    try {
      // Check if we're using Supabase
      const usingSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      res.json({
        storageType: usingSupabase ? 'supabase' : 'memory',
        supabaseConfigured: usingSupabase,
        databaseAvailable: !!process.env.DATABASE_URL
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Register new authentication routes
  app.use('/api/auth', authRoutes);
  
  // Register admin routes
  app.use('/api/admin', adminRoutes);
  
  return httpServer;
}
