import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { SupabaseStorage } from './supabaseStorage';

// Load environment variables from multiple possible locations
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve('/home/runner/workspace/.env')
];

// Declare hardcoded Supabase variables as fallback in case environment loading fails
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzpaupkksrrvbuxtraal.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cGF1cGtrc3JydmJ1eHRyYWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzIwNzQsImV4cCI6MjA1ODMwODA3NH0.PnqZ_4sLveIngGoH7ar4e0izBUTyqIrucJYchuRO4d8';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cGF1cGtrc3JydmJ1eHRyYWFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjczMjA3NCwiZXhwIjoyMDU4MzA4MDc0fQ.Y1sftdaslvme7S0173tf0U8ZfiGC8HjLJSyA6FfNVXo';

console.log('Storage - Environment variables check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINED' : 'UNDEFINED');

import {
  users, User, InsertUser,
  jobs, Job, InsertJob,
  proposals, Proposal, InsertProposal,
  contracts, Contract, InsertContract,
  messages, Message, InsertMessage,
  payments, Payment, InsertPayment,
  reviews, Review, InsertReview,
  walletTransactions, WalletTransaction, InsertWalletTransaction,
  escrowAccounts, EscrowAccount, InsertEscrowAccount,
  activities, Activity, InsertActivity,
  notifications, Notification, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // Database instance for direct queries
  db: any;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>; // Added for admin
  getUserCount(): Promise<number>; // Added for admin pagination
  deleteUser(id: number): Promise<boolean>; // Added for admin

  // Job operations
  getJobs(limit?: number, offset?: number): Promise<Job[]>;
  getJobsByCategory(category: string): Promise<Job[]>;
  getJobsByClient(clientId: number): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob, clientId: number): Promise<Job>;
  updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined>;

  // Proposal operations
  getProposalsByJob(jobId: number): Promise<Proposal[]>;
  getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]>;
  getProposal(id: number): Promise<Proposal | undefined>;
  createProposal(proposal: InsertProposal, freelancerId: number): Promise<Proposal>;
  updateProposal(id: number, proposalData: Partial<Proposal>): Promise<Proposal | undefined>;

  // Contract operations
  getContractsByJob(jobId: number): Promise<Contract[]>;
  getContractsByClient(clientId: number): Promise<Contract[]>;
  getContractsByFreelancer(freelancerId: number): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined>;

  // Message operations
  getMessagesBetweenUsers(userOneId: number, userTwoId: number, limit?: number): Promise<Message[]>;
  getMessagesByJob(jobId: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Payment operations
  getPaymentsByContract(contractId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined>;

  // Review operations
  getReviewsByUser(userId: number): Promise<Review[]>;
  getReviewsByContract(contractId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Wallet operations
  getWalletTransactionsByUser(userId: number, limit?: number): Promise<WalletTransaction[]>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  updateWalletTransaction(id: number, status: string, completedAt?: Date): Promise<WalletTransaction | undefined>;
  updateUserWalletBalance(userId: number, amount: number): Promise<User | undefined>;

  // Escrow operations
  getEscrowAccount(id: number): Promise<EscrowAccount | undefined>;
  getEscrowAccountByContract(contractId: number): Promise<EscrowAccount | undefined>;
  createEscrowAccount(escrow: InsertEscrowAccount): Promise<EscrowAccount>;
  updateEscrowAccount(id: number, escrowData: Partial<EscrowAccount>): Promise<EscrowAccount | undefined>;
  releaseEscrow(contractId: number, releaseAmount: number, releasedBy: number): Promise<boolean>;
  
  // Activity operations
  getUserActivities(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Notification operations
  getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number, userId: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  public db: any = null; // Add db property to implement IStorage interface
  
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private proposals: Map<number, Proposal>;
  private contracts: Map<number, Contract>;
  private messages: Map<number, Message>;
  private payments: Map<number, Payment>;
  private reviews: Map<number, Review>;
  private activities: Map<number, Activity>;
  private walletTransactions: Map<number, WalletTransaction>;
  private escrowAccounts: Map<number, EscrowAccount>;
  private notifications: Map<number, Notification>;

  private userId: number;
  private jobId: number;
  private proposalId: number;
  private contractId: number;
  private messageId: number;
  private paymentId: number;
  private reviewId: number;
  private activityId: number;
  private walletTransactionId: number;
  private escrowAccountId: number;
  private notificationId: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.proposals = new Map();
    this.contracts = new Map();
    this.messages = new Map();
    this.payments = new Map();
    this.reviews = new Map();
    this.activities = new Map();
    this.walletTransactions = new Map();
    this.escrowAccounts = new Map();
    this.notifications = new Map();

    this.userId = 1;
    this.jobId = 1;
    this.proposalId = 1;
    this.contractId = 1;
    this.messageId = 1;
    this.paymentId = 1;
    this.reviewId = 1;
    this.activityId = 1;
    this.walletTransactionId = 1;
    this.escrowAccountId = 1;
    this.notificationId = 1;

    // Add some initial data
    this.seedData();
  }

  private seedData() {
    // Create test client user
    const clientUser: User = {
      id: this.userId++,
      role: "client",
      email: "client@example.com",
      username: "testclient",
      password: "password123",
      fullName: "Test Client",
      bio: "I'm a client looking for freelancers for my projects.",
      avatar: null,
      skills: null,
      hourlyRate: null,
      location: "New York, USA",
      walletBalance: 1000, // Initial balance
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      permissions: {}, // Default empty permissions
      lastLogin: null,  // No login yet
      active: true
    };
    this.users.set(clientUser.id, clientUser);

    // Create test freelancer user
    const freelancerUser: User = {
      id: this.userId++,
      role: "freelancer",
      email: "freelancer@example.com",
      username: "testfreelancer",
      password: "password123",
      fullName: "Test Freelancer",
      bio: "Experienced developer specializing in full-stack development.",
      avatar: null,
      skills: ["JavaScript", "React", "Node.js", "TypeScript"],
      hourlyRate: 45,
      location: "San Francisco, USA",
      walletBalance: 500, // Initial balance
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      permissions: {}, // Default empty permissions
      lastLogin: null,  // No login yet
      active: true
    };
    this.users.set(freelancerUser.id, freelancerUser);

    // Create admin user
    const adminUser: User = {
      id: this.userId++,
      role: "admin",
      email: "admin@example.com",
      username: "admin",
      password: "password123",
      fullName: "Admin User",
      bio: "Platform administrator with full access.",
      avatar: null,
      skills: null,
      hourlyRate: null,
      location: "Remote",
      walletBalance: 2000, // Admin has larger balance for system operations
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago (earlier than other users)
      permissions: { isAdmin: true }, // Admin permissions
      lastLogin: null, // No login yet
      active: true
    };
    this.users.set(adminUser.id, adminUser);

    // Create support user
    const supportUser: User = {
      id: this.userId++,
      role: "support",
      email: "support@example.com",
      username: "support_agent",
      password: "password123",
      fullName: "Support Agent",
      bio: "Customer support specialist helping users with platform-related issues.",
      avatar: null,
      skills: null,
      hourlyRate: null,
      location: "Remote",
      walletBalance: 500, // Support team has standard balance
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      permissions: { canManageTickets: true }, // Support permissions
      lastLogin: null, // No login yet
      active: true
    };
    this.users.set(supportUser.id, supportUser);

    // Create QA user
    const qaUser: User = {
      id: this.userId++,
      role: "qa",
      email: "qa@example.com",
      username: "qa_specialist",
      password: "password123",
      fullName: "QA Specialist",
      bio: "Quality assurance specialist reviewing projects and resolving disputes.",
      avatar: null,
      skills: null,
      hourlyRate: null,
      location: "Remote",
      walletBalance: 1500, // QA has higher balance for handling escrows
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      permissions: { canManageDisputes: true }, // QA permissions
      lastLogin: null, // No login yet
      active: true
    };
    this.users.set(qaUser.id, qaUser);

    // Create some test jobs
    const job1: Job = {
      id: this.jobId++,
      title: "Build a responsive e-commerce website",
      category: "Web Development",
      description: "Looking for an experienced developer to build a responsive e-commerce website with product catalog, shopping cart, and payment integration.",
      skills: ["JavaScript", "React", "CSS", "Node.js"],
      hourlyRate: null,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      clientId: clientUser.id,
      budget: 2500,
      status: "open",
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.jobs.set(job1.id, job1);

    const job2: Job = {
      id: this.jobId++,
      title: "Mobile App Development - Fitness Tracker",
      category: "Mobile Development",
      description: "Need a freelancer to build a fitness tracking mobile app with workout plans, progress tracking, and social features.",
      skills: ["React Native", "Firebase", "UI/UX Design"],
      hourlyRate: 40,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      clientId: clientUser.id,
      budget: null,
      status: "open",
      deadlineDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    };
    this.jobs.set(job2.id, job2);

    // Create a test proposal
    const proposal1: Proposal = {
      id: this.proposalId++,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "pending",
      jobId: job1.id,
      freelancerId: freelancerUser.id,
      coverLetter: "I have extensive experience building e-commerce websites and would love to work on your project. I can deliver a high-quality solution within your timeframe and budget.",
      bidAmount: 2200,
      estimatedDuration: 21
    };
    this.proposals.set(proposal1.id, proposal1);

    // Create a comprehensive conversation between client and freelancer
    const messages: Message[] = [
      // Initial conversation about e-commerce website project
      {
        id: this.messageId++,
        content: "Hi, I'm interested in your e-commerce website project. Do you have any specific design requirements?",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "Hello! Thanks for reaching out. I'm looking for a modern and clean design with an emphasis on product images. Our target audience is young professionals interested in sustainable fashion.",
        createdAt: new Date(Date.now() - 6.9 * 24 * 60 * 60 * 1000), // 6.9 days ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "That sounds perfect for my expertise. I've designed several e-commerce sites with sustainability themes. Would you like to see some examples of my previous work?",
        createdAt: new Date(Date.now() - 6.8 * 24 * 60 * 60 * 1000), // 6.8 days ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "Yes please! I'd also like to know how you'd approach integrating a wishlist feature and cart system that syncs across devices.",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "Here's a link to my portfolio with similar projects: www.example.com/portfolio. For the wishlist and cart sync, I recommend using a combination of local storage and user accounts. I can implement this with Redux for state management and sync with the backend database when users are logged in.",
        createdAt: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000), // 5.5 days ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "I checked your portfolio - impressive work! Your approach to the wishlist/cart feature sounds good. What about payment processing? We need something secure and user-friendly.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "Thank you! For payments, I recommend Stripe integration. It's secure, handles multiple payment methods, and has excellent developer tools. I can implement a seamless checkout flow that keeps users on your site during the whole process.",
        createdAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000), // 4.5 days ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "That sounds perfect. What's your timeline like? We're hoping to launch in about 6 weeks.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "I can definitely meet a 6-week timeline. I'd break it down as: 1 week for planning and design approval, 3 weeks for core development, 1 week for payment integration and testing, and 1 week for final revisions and deployment. Does that work for you?",
        createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000), // 3.5 days ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "That timeline works perfectly. I'd like to move forward with you on this project. Can you prepare a detailed proposal with cost breakdown based on what we've discussed?",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "Absolutely! I'll work on the proposal today and have it to you by tomorrow. I'm excited about the opportunity to work together on this project.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "I've completed the proposal and just sent it through the platform. It includes a detailed timeline, cost structure, and implementation approach for all the features we discussed. Looking forward to your feedback!",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        jobId: job1.id,
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "Got the proposal, thank you! I'm reviewing it with my team and we'll get back to you within 24 hours with our decision or any questions.",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: true
      },
      {
        id: this.messageId++,
        content: "We've reviewed your proposal and it looks great! We'd like to proceed. When can you start and what's the first step?",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        jobId: job1.id,
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        read: false
      }
    ];
    
    // Add all messages to the storage
    for (const message of messages) {
      this.messages.set(message.id, message);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();

    // Ensure all optional fields have explicitly null values when undefined
    // Set a default wallet balance for new users
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      bio: insertUser.bio ?? null,
      avatar: insertUser.avatar ?? null,
      skills: insertUser.skills ?? null,
      hourlyRate: insertUser.hourlyRate ?? null,
      location: insertUser.location ?? null,
      walletBalance: insertUser.walletBalance ?? 0, // Default wallet balance is 0
      permissions: insertUser.permissions ?? {}, // Default empty permissions
      lastLogin: insertUser.lastLogin ?? null, // Default null last login
      active: insertUser.active ?? true // Default to active account
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(limit = 10, offset = 0): Promise<User[]> {
    // Convert Map to Array, sort by id, and apply pagination
    return Array.from(this.users.values())
      .sort((a, b) => a.id - b.id)
      .slice(offset, offset + limit);
  }
  
  async getUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const exists = this.users.has(id);
    
    if (!exists) {
      return false;
    }
    
    return this.users.delete(id);
  }

  // Job operations
  async getJobs(limit = 10, offset = 0): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getJobsByCategory(category: string): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob, clientId: number): Promise<Job> {
    const id = this.jobId++;
    const now = new Date();
    const job: Job = { 
      ...insertJob, 
      id, 
      clientId, 
      status: "open", 
      createdAt: now,
      skills: insertJob.skills ?? null,
      hourlyRate: insertJob.hourlyRate ?? null,
      budget: insertJob.budget ?? null,
      deadlineDate: insertJob.deadlineDate ?? null
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...jobData };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // Proposal operations
  async getProposalsByJob(jobId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values())
      .filter(proposal => proposal.jobId === jobId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values())
      .filter(proposal => proposal.freelancerId === freelancerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async createProposal(insertProposal: InsertProposal, freelancerId: number): Promise<Proposal> {
    const id = this.proposalId++;
    const now = new Date();
    const proposal: Proposal = { 
      ...insertProposal, 
      id, 
      freelancerId, 
      status: "pending", 
      createdAt: now,
      estimatedDuration: insertProposal.estimatedDuration ?? null
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: number, proposalData: Partial<Proposal>): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;

    const updatedProposal = { ...proposal, ...proposalData };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  // Contract operations
  async getContractsByJob(jobId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values())
      .filter(contract => contract.jobId === jobId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContractsByClient(clientId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values())
      .filter(contract => contract.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContractsByFreelancer(freelancerId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values())
      .filter(contract => contract.freelancerId === freelancerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.contractId++;
    const now = new Date();
    const contract: Contract = { 
      ...insertContract, 
      id, 
      status: "active", 
      startDate: now, 
      createdAt: now,
      endDate: insertContract.endDate ?? null
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    const updatedContract = { ...contract, ...contractData };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  // Message operations
  async getMessagesBetweenUsers(userOneId: number, userTwoId: number, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userOneId && message.receiverId === userTwoId) ||
        (message.senderId === userTwoId && message.receiverId === userOneId)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);
  }

  async getMessagesByJob(jobId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.jobId === jobId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.read)
      .length;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      read: false, 
      createdAt: now,
      jobId: insertMessage.jobId ?? null
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Payment operations
  async getPaymentsByContract(contractId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.contractId === contractId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const now = new Date();
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      status: "pending", 
      createdAt: now, 
      updatedAt: now,
      description: insertPayment.description ?? null
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment = { 
      ...payment, 
      ...paymentData, 
      updatedAt: new Date() 
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Review operations
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReviewsByContract(contractId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.contractId === contractId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const now = new Date();
    const review: Review = { 
      ...insertReview, 
      id, 
      createdAt: now,
      comment: insertReview.comment ?? null
    };
    this.reviews.set(id, review);
    return review;
  }

  // Wallet operations
  async getWalletTransactionsByUser(userId: number, limit = 10): Promise<WalletTransaction[]> {
    return Array.from(this.walletTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createWalletTransaction(insertTransaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const id = this.walletTransactionId++;
    const now = new Date();
    
    const transaction: WalletTransaction = {
      ...insertTransaction,
      id,
      status: "pending",
      createdAt: now,
      completedAt: null,
      // Ensure required fields have proper defaults
      description: insertTransaction.description ?? null,
      reference: insertTransaction.reference ?? null,
      metadata: insertTransaction.metadata ?? {}
    };
    
    this.walletTransactions.set(id, transaction);
    return transaction;
  }

  async updateWalletTransaction(
    id: number, 
    status: "completed" | "pending" | "failed" | "processing", 
    completedAt?: Date
  ): Promise<WalletTransaction | undefined> {
    const transaction = this.walletTransactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: WalletTransaction = {
      ...transaction,
      status,
      completedAt: completedAt || (status === "completed" ? new Date() : transaction.completedAt)
    };
    
    this.walletTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async updateUserWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance + amount
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Escrow operations
  async getEscrowAccount(id: number): Promise<EscrowAccount | undefined> {
    return this.escrowAccounts.get(id);
  }

  async getEscrowAccountByContract(contractId: number): Promise<EscrowAccount | undefined> {
    return Array.from(this.escrowAccounts.values())
      .find(escrow => escrow.contractId === contractId);
  }

  async createEscrowAccount(insertEscrow: InsertEscrowAccount): Promise<EscrowAccount> {
    const id = this.escrowAccountId++;
    const now = new Date();
    
    const escrow: EscrowAccount = {
      ...insertEscrow,
      id,
      amount: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
      supervisorId: insertEscrow.supervisorId ?? null
    };
    
    this.escrowAccounts.set(id, escrow);
    return escrow;
  }

  async updateEscrowAccount(id: number, escrowData: Partial<EscrowAccount>): Promise<EscrowAccount | undefined> {
    const escrow = this.escrowAccounts.get(id);
    if (!escrow) return undefined;
    
    // Ensure status is one of the valid types
    let status = escrowData.status;
    if (status && !["active", "released", "refunded", "disputed"].includes(status)) {
      status = "active";
    }
    
    const updatedEscrow: EscrowAccount = {
      ...escrow,
      ...escrowData,
      status: status as "active" | "released" | "refunded" | "disputed" || escrow.status,
      updatedAt: new Date()
    };
    
    this.escrowAccounts.set(id, updatedEscrow);
    return updatedEscrow;
  }

  async releaseEscrow(contractId: number, releaseAmount: number, releasedBy: number): Promise<boolean> {
    // Find the escrow account for this contract
    const escrow = Array.from(this.escrowAccounts.values())
      .find(e => e.contractId === contractId);
    
    if (!escrow) return false;
    if (escrow.status !== "active") return false;
    if (releaseAmount > escrow.amount) return false;

    // Get contract to identify the freelancer
    const contract = this.contracts.get(contractId);
    if (!contract) return false;

    try {
      // Update escrow account with proper status type
      const newStatus: "active" | "released" | "refunded" | "disputed" = 
        escrow.amount - releaseAmount === 0 ? "released" : "active";
      
      const updatedEscrow: EscrowAccount = {
        ...escrow,
        amount: escrow.amount - releaseAmount,
        status: newStatus,
        updatedAt: new Date()
      };
      this.escrowAccounts.set(escrow.id, updatedEscrow);

      // Update freelancer's wallet balance
      const freelancer = this.users.get(contract.freelancerId);
      if (!freelancer) return false;
      
      const updatedFreelancer = {
        ...freelancer,
        walletBalance: freelancer.walletBalance + releaseAmount
      };
      this.users.set(freelancer.id, updatedFreelancer);
      
      // Create wallet transaction record with explicit typing
      const transaction: WalletTransaction = {
        id: this.walletTransactionId++,
        userId: freelancer.id,
        amount: releaseAmount,
        type: "escrow_release",
        status: "completed",
        description: `Payment released from escrow for contract #${contractId}`,
        reference: `contract-${contractId}-release-${Date.now()}`,
        metadata: { 
          contractId,
          releasedBy,
          escrowId: escrow.id
        },
        createdAt: new Date(),
        completedAt: new Date()
      };
      this.walletTransactions.set(transaction.id, transaction);
      
      return true;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return false;
    }
  }

  // Activity operations
  async getUserActivities(userId: number, limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: now,
      metadata: insertActivity.metadata ?? {}
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Notification operations
  async getNotificationsByUser(userId: number, limit = 10): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const now = new Date();
    
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: now,
      read: false,
      type: insertNotification.type || "info", // Default to "info" if not provided
      link: insertNotification.link ?? null
    };
    
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number, userId: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    if (notification.userId !== userId) {
      return undefined; // Only the notification owner can mark it as read
    }
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read);
    
    userNotifications.forEach(notification => {
      const updatedNotification = { ...notification, read: true };
      this.notifications.set(notification.id, updatedNotification);
    });
    
    return true;
  }
}

// Determine which storage implementation to use
let storageImplementation: IStorage;

// Create a function to directly initialize storage without async
const initializeStorage = (): IStorage => {
  // Debug environment variables
  console.log('Storage - Environment variables check:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'DEFINED' : 'UNDEFINED');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINED' : 'UNDEFINED');
  
  // Check if we are using Supabase (environment variables are set)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      // Try to connect to Supabase
      const supStorage = new SupabaseStorage();
      console.log('Using Supabase storage implementation');
      return supStorage;
    } catch (error) {
      console.error('Failed to initialize Supabase storage, falling back to memory storage:', error);
      console.log('IMPORTANT: Using in-memory storage as fallback. Data will be lost on server restart.');
      return new MemStorage();
    }
  } else {
    // Fall back to in-memory storage
    console.log('Supabase credentials not found, using in-memory storage');
    console.log('IMPORTANT: Using in-memory storage. Data will be lost on server restart.');
    return new MemStorage();
  }
};

// Initialize storage synchronously
storageImplementation = initializeStorage();

export const storage = storageImplementation;