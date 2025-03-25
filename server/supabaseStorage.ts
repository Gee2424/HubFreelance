import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
import postgres from 'postgres';

import {
  users, User, InsertUser,
  jobs, Job, InsertJob,
  proposals, Proposal, InsertProposal,
  contracts, Contract, InsertContract,
  messages, Message, InsertMessage,
  payments, Payment, InsertPayment,
  reviews, Review, InsertReview,
  activities, Activity, InsertActivity,
  walletTransactions, WalletTransaction, InsertWalletTransaction,
  escrowAccounts, EscrowAccount, InsertEscrowAccount,
  notifications, Notification, InsertNotification
} from "@shared/schema";

import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  public supabase; // Changed to public to allow access for seeding
  public db;

  constructor(externalSupabaseClient?: any) {
    // Get environment variables
    console.log('Storage - Environment variables check:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'DEFINED' : 'UNDEFINED');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINED' : 'UNDEFINED');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Check for database URL from multiple possible sources
    let databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('DATABASE_URL not found, using local PostgreSQL connection');
      
      // Build a connection string from PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE
      if (process.env.PGUSER && process.env.PGHOST && process.env.PGDATABASE) {
        const pgUser = process.env.PGUSER;
        const pgPassword = process.env.PGPASSWORD || '';
        const pgHost = process.env.PGHOST;
        const pgPort = process.env.PGPORT || '5432';
        const pgDatabase = process.env.PGDATABASE;
        
        databaseUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
        console.log('Built database URL from PostgreSQL environment variables');
      } else {
        // Fallback for local development
        databaseUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';
        console.log('Using default fallback PostgreSQL connection');
      }
      
      // Store for later use
      process.env.DATABASE_URL = databaseUrl;
    }

    try {
      // Initialize Drizzle with Postgres
      // Disable prepare as it is not supported for "Transaction" pool mode in Supabase
      const sql = postgres(databaseUrl, { 
        connect_timeout: 10, // slightly longer timeout
        idle_timeout: 30,
        max: 10, // connection pool size
        prepare: false // Required for Supabase's transaction pool mode
      });
      this.db = drizzle(sql);
      console.log('Using Supabase storage implementation');
    } catch (err) {
      console.error('Failed to initialize database connection:', err);
      throw new Error('Database connection failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    
    // Initialize Supabase client if credentials are available
    if (supabaseUrl && supabaseKey) {
      // Use provided client or initialize a new one
      this.supabase = externalSupabaseClient || createClient(supabaseUrl, supabaseKey);
    } else {
      console.log('Missing Supabase credentials, some functionality may be limited');
      // Create a minimal client that doesn't throw errors but won't work for auth
      this.supabase = {
        auth: { signUp: () => { console.log('Supabase auth not configured'); } },
        from: () => ({ select: () => ({ data: null, error: new Error('Supabase not configured') }) })
      };
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // First create auth user in Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.username,
            full_name: user.fullName,
            role: user.role,
            bio: user.bio,
            avatar_url: user.avatar,
            skills: user.skills,
            hourly_rate: user.hourlyRate,
            location: user.location
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Then create user record in our database
      const result = await this.db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      // First, fetch the current user to get the email
      const currentUser = await this.getUser(id);
      if (!currentUser) {
        return undefined;
      }

      // Prepare metadata to update
      const metadataToUpdate: any = {};
      if (userData.username) metadataToUpdate.username = userData.username;
      if (userData.fullName) metadataToUpdate.full_name = userData.fullName;
      if (userData.role) metadataToUpdate.role = userData.role;
      if (userData.bio !== undefined) metadataToUpdate.bio = userData.bio;
      if (userData.avatar !== undefined) metadataToUpdate.avatar_url = userData.avatar;
      if (userData.skills) metadataToUpdate.skills = userData.skills;
      if (userData.hourlyRate !== undefined) metadataToUpdate.hourly_rate = userData.hourlyRate;
      if (userData.location !== undefined) metadataToUpdate.location = userData.location;

      // Update user metadata in Supabase - requires user to be logged in
      // In a real implementation, you might use server-side JWT or admin APIs
      if (Object.keys(metadataToUpdate).length > 0) {
        try {
          const { error: metadataError } = await this.supabase.auth.updateUser({
            data: metadataToUpdate
          });

          if (metadataError) {
            console.warn('Error updating Supabase user metadata:', metadataError);
            // Continue with database update even if Supabase user metadata update fails
          }
        } catch (metadataUpdateError) {
          console.warn('Exception updating Supabase user metadata:', metadataUpdateError);
          // Continue with database update even if Supabase user metadata update fails
        }
      }

      // Update user in database
      const result = await this.db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Job operations
  async getJobs(limit = 10, offset = 0): Promise<Job[]> {
    try {
      return await this.db.select().from(jobs).limit(limit).offset(offset);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }

  async getJobsByCategory(category: string): Promise<Job[]> {
    try {
      return await this.db.select().from(jobs).where(eq(jobs.category, category));
    } catch (error) {
      console.error('Error fetching jobs by category:', error);
      return [];
    }
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    try {
      return await this.db.select().from(jobs).where(eq(jobs.clientId, clientId));
    } catch (error) {
      console.error('Error fetching jobs by client:', error);
      return [];
    }
  }

  async getJob(id: number): Promise<Job | undefined> {
    try {
      const result = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching job:', error);
      return undefined;
    }
  }

  async createJob(job: InsertJob, clientId: number): Promise<Job> {
    try {
      const result = await this.db
        .insert(jobs)
        .values({ ...job, clientId })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    try {
      const result = await this.db
        .update(jobs)
        .set(jobData)
        .where(eq(jobs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating job:', error);
      return undefined;
    }
  }

  // Proposal operations
  async getProposalsByJob(jobId: number): Promise<Proposal[]> {
    try {
      return await this.db.select().from(proposals).where(eq(proposals.jobId, jobId));
    } catch (error) {
      console.error('Error fetching proposals by job:', error);
      return [];
    }
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    try {
      return await this.db.select().from(proposals).where(eq(proposals.freelancerId, freelancerId));
    } catch (error) {
      console.error('Error fetching proposals by freelancer:', error);
      return [];
    }
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    try {
      const result = await this.db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching proposal:', error);
      return undefined;
    }
  }

  async createProposal(proposal: InsertProposal, freelancerId: number): Promise<Proposal> {
    try {
      const result = await this.db
        .insert(proposals)
        .values({ ...proposal, freelancerId })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  async updateProposal(id: number, proposalData: Partial<Proposal>): Promise<Proposal | undefined> {
    try {
      const result = await this.db
        .update(proposals)
        .set(proposalData)
        .where(eq(proposals.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating proposal:', error);
      return undefined;
    }
  }

  // Contract operations
  async getContractsByJob(jobId: number): Promise<Contract[]> {
    try {
      return await this.db.select().from(contracts).where(eq(contracts.jobId, jobId));
    } catch (error) {
      console.error('Error fetching contracts by job:', error);
      return [];
    }
  }

  async getContractsByClient(clientId: number): Promise<Contract[]> {
    try {
      return await this.db.select().from(contracts).where(eq(contracts.clientId, clientId));
    } catch (error) {
      console.error('Error fetching contracts by client:', error);
      return [];
    }
  }

  async getContractsByFreelancer(freelancerId: number): Promise<Contract[]> {
    try {
      return await this.db.select().from(contracts).where(eq(contracts.freelancerId, freelancerId));
    } catch (error) {
      console.error('Error fetching contracts by freelancer:', error);
      return [];
    }
  }

  async getContract(id: number): Promise<Contract | undefined> {
    try {
      const result = await this.db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching contract:', error);
      return undefined;
    }
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    try {
      const result = await this.db
        .insert(contracts)
        .values(contract)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined> {
    try {
      const result = await this.db
        .update(contracts)
        .set(contractData)
        .where(eq(contracts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating contract:', error);
      return undefined;
    }
  }

  // Message operations
  async getMessagesBetweenUsers(userOneId: number, userTwoId: number, limit = 50): Promise<Message[]> {
    try {
      return await this.db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userOneId),
              eq(messages.receiverId, userTwoId)
            ),
            and(
              eq(messages.senderId, userTwoId),
              eq(messages.receiverId, userOneId)
            )
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching messages between users:', error);
      return [];
    }
  }

  async getMessagesByJob(jobId: number): Promise<Message[]> {
    try {
      return await this.db
        .select()
        .from(messages)
        .where(eq(messages.jobId, jobId))
        .orderBy(desc(messages.createdAt));
    } catch (error) {
      console.error('Error fetching messages by job:', error);
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const result = await this.db
        .insert(messages)
        .values(message)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        ));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    try {
      const result = await this.db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error marking message as read:', error);
      return undefined;
    }
  }

  // Payment operations
  async getPaymentsByContract(contractId: number): Promise<Payment[]> {
    try {
      return await this.db
        .select()
        .from(payments)
        .where(eq(payments.contractId, contractId))
        .orderBy(desc(payments.createdAt));
    } catch (error) {
      console.error('Error fetching payments by contract:', error);
      return [];
    }
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const result = await this.db.select().from(payments).where(eq(payments.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching payment:', error);
      return undefined;
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const result = await this.db
        .insert(payments)
        .values(payment)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    try {
      const result = await this.db
        .update(payments)
        .set(paymentData)
        .where(eq(payments.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating payment:', error);
      return undefined;
    }
  }

  // Review operations
  async getReviewsByUser(userId: number): Promise<Review[]> {
    try {
      return await this.db
        .select()
        .from(reviews)
        .where(eq(reviews.receiverId, userId))
        .orderBy(desc(reviews.createdAt));
    } catch (error) {
      console.error('Error fetching reviews by user:', error);
      return [];
    }
  }

  async getReviewsByContract(contractId: number): Promise<Review[]> {
    try {
      return await this.db
        .select()
        .from(reviews)
        .where(eq(reviews.contractId, contractId))
        .orderBy(desc(reviews.createdAt));
    } catch (error) {
      console.error('Error fetching reviews by contract:', error);
      return [];
    }
  }

  async createReview(review: InsertReview): Promise<Review> {
    try {
      const result = await this.db
        .insert(reviews)
        .values(review)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Activity operations
  async getUserActivities(userId: number, limit = 10): Promise<Activity[]> {
    try {
      return await this.db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    try {
      const result = await this.db
        .insert(activities)
        .values(activity)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Notification operations
  async getNotificationsByUser(userId: number, limit = 10): Promise<Notification[]> {
    try {
      return await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching notifications by user:', error);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      // Ensure type is set with default of "info"
      const notificationToInsert = {
        ...notification,
        type: notification.type || "info"
      };
      
      const result = await this.db
        .insert(notifications)
        .values(notificationToInsert)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number, userId: number): Promise<Notification | undefined> {
    try {
      // Verify the notification belongs to the specified user
      const notification = await this.db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        ))
        .limit(1);
      
      if (!notification || notification.length === 0) {
        return undefined;
      }
      
      const result = await this.db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return undefined;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await this.db
        .update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Wallet operations
  async getWalletTransactionsByUser(userId: number, limit = 10): Promise<WalletTransaction[]> {
    try {
      return await this.db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching wallet transactions by user:', error);
      return [];
    }
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    try {
      const result = await this.db
        .insert(walletTransactions)
        .values({ 
          ...transaction,
          // Ensure these fields have proper default values
          description: transaction.description ?? null,
          reference: transaction.reference ?? null,
          metadata: transaction.metadata ?? {}
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating wallet transaction:', error);
      throw error;
    }
  }

  async updateWalletTransaction(id: number, status: "completed" | "pending" | "failed" | "processing", completedAt?: Date): Promise<WalletTransaction | undefined> {
    try {
      const result = await this.db
        .update(walletTransactions)
        .set({ 
          status,
          completedAt: completedAt ?? null
        })
        .where(eq(walletTransactions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating wallet transaction:', error);
      return undefined;
    }
  }

  async getAllUsers(limit = 10, offset = 0): Promise<User[]> {
    try {
      const { data, error } = await this.db
        .select()
        .from(users)
        .orderBy(asc(users.id))
        .limit(limit)
        .offset(offset);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const { data, error } = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      
      if (error) throw error;
      return data[0].count;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Option 1: Soft delete by setting active status to false
      // Uncomment this if you prefer soft deletion
      /*
      const { data, error } = await this.db
        .update(users)
        .set({ active: false })
        .where(eq(users.id, id))
        .returning();
      */
      
      // Option 2: Hard delete
      const { data, error } = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      if (error) throw error;
      return data.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async updateUserWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    try {
      // Get current user to read current balance
      const user = await this.getUser(userId);
      if (!user) {
        console.error('User not found for wallet balance update');
        return undefined;
      }

      // Calculate new balance
      const newBalance = (user.walletBalance || 0) + amount;
      if (newBalance < 0) {
        throw new Error('Insufficient funds');
      }

      // Update user wallet balance
      const result = await this.db
        .update(users)
        .set({ walletBalance: newBalance })
        .where(eq(users.id, userId))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating user wallet balance:', error);
      return undefined;
    }
  }

  // Escrow operations
  async getEscrowAccount(id: number): Promise<EscrowAccount | undefined> {
    try {
      const result = await this.db
        .select()
        .from(escrowAccounts)
        .where(eq(escrowAccounts.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching escrow account:', error);
      return undefined;
    }
  }

  async getEscrowAccountByContract(contractId: number): Promise<EscrowAccount | undefined> {
    try {
      const result = await this.db
        .select()
        .from(escrowAccounts)
        .where(eq(escrowAccounts.contractId, contractId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching escrow account by contract:', error);
      return undefined;
    }
  }

  async createEscrowAccount(escrow: InsertEscrowAccount): Promise<EscrowAccount> {
    try {
      const result = await this.db
        .insert(escrowAccounts)
        .values(escrow)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating escrow account:', error);
      throw error;
    }
  }

  async updateEscrowAccount(id: number, escrowData: Partial<EscrowAccount>): Promise<EscrowAccount | undefined> {
    try {
      // Make sure status is valid if provided
      if (escrowData.status && !["active", "released", "refunded", "disputed"].includes(escrowData.status)) {
        escrowData.status = "active"; // Default to active if invalid
      }

      const result = await this.db
        .update(escrowAccounts)
        .set({
          ...escrowData,
          updatedAt: new Date()
        })
        .where(eq(escrowAccounts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating escrow account:', error);
      return undefined;
    }
  }

  async releaseEscrow(contractId: number, releaseAmount: number, releasedBy: number): Promise<boolean> {
    try {
      // Get contract details
      const contract = await this.getContract(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Get escrow account
      const escrow = await this.getEscrowAccountByContract(contractId);
      if (!escrow) {
        throw new Error('Escrow account not found');
      }

      // Check if there are sufficient funds in escrow
      if (escrow.amount < releaseAmount) {
        throw new Error('Insufficient funds in escrow');
      }

      // Begin transaction
      // Note: In a real application, you would use a proper SQL transaction here
      
      // Update escrow amount
      const remainingAmount = escrow.amount - releaseAmount;
      let status = escrow.status;
      
      if (remainingAmount === 0) {
        status = "released";
      }
      
      // Update escrow account
      const updatedEscrow = await this.updateEscrowAccount(escrow.id, {
        amount: remainingAmount,
        status: status as "active" | "released" | "refunded" | "disputed",
        updatedAt: new Date()
      });
      
      if (!updatedEscrow) {
        throw new Error('Failed to update escrow account');
      }
      
      // Add funds to freelancer's wallet
      const updatedFreelancer = await this.updateUserWalletBalance(contract.freelancerId, releaseAmount);
      
      if (!updatedFreelancer) {
        throw new Error('Failed to update freelancer wallet balance');
      }
      
      // Create transaction records
      
      // Escrow transaction (debit)
      await this.createWalletTransaction({
        userId: releasedBy,
        amount: -releaseAmount,
        type: "escrow_release",
        description: `Released from escrow for contract #${contractId}`,
        reference: `escrow-release-${escrow.id}-contract-${contractId}`,
        metadata: {
          contractId,
          escrowId: escrow.id,
          releaseAmount,
          remainingEscrow: remainingAmount
        }
      });
      
      // Freelancer transaction (credit)
      await this.createWalletTransaction({
        userId: contract.freelancerId,
        amount: releaseAmount,
        type: "escrow_release",
        description: `Payment received from contract #${contractId}`,
        reference: `payment-from-escrow-${escrow.id}-contract-${contractId}`,
        metadata: {
          contractId,
          escrowId: escrow.id,
          from: releasedBy
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return false;
    }
  }
}