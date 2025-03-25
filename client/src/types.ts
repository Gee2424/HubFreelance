import { 
  User, Job, Proposal, Contract, 
  Message, Payment, Review, Activity,
  WalletTransaction, EscrowAccount, SupportTicket,
  Dispute, Permission, RolePermission, UserSession,
  SystemConfig, AuditLog
} from "@shared/schema";

// Extended types for frontend use
export interface UserWithoutPassword extends Omit<User, 'password'> {}

// Re-export types from schema
export { 
  WalletTransaction, EscrowAccount, SupportTicket, 
  Dispute, Permission, RolePermission, UserSession,
  SystemConfig, AuditLog 
};

export interface JobWithClient extends Job {
  client?: UserWithoutPassword;
}

export interface ProposalWithFreelancer extends Proposal {
  freelancer?: UserWithoutPassword;
}

export interface MessageWithUsers extends Message {
  sender?: UserWithoutPassword;
  receiver?: UserWithoutPassword;
}

export interface ContractWithUsers extends Contract {
  client?: UserWithoutPassword;
  freelancer?: UserWithoutPassword;
  job?: Job;
}

export interface ReviewWithUsers extends Review {
  reviewer?: UserWithoutPassword;
  receiver?: UserWithoutPassword;
}

export interface ActivityWithDetails extends Activity {
  metadataDetails?: Record<string, any>;
}

export type UserRole = "client" | "freelancer" | "admin" | "support" | "qa" | "dispute_resolution" | "accounts";

export type JobStatus = "open" | "in_progress" | "completed" | "canceled";

export type ProposalStatus = "pending" | "accepted" | "rejected";

export type ContractStatus = "active" | "completed" | "canceled";

export type PaymentStatus = "pending" | "held" | "released" | "refunded";

export type ActivityType = "job_posted" | "proposal_submitted" | "message_sent" | 
                          "contract_created" | "payment_released" | "review_submitted";

export interface JobCategory {
  name: string;
  icon: string;
  description: string;
  count: number;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  comment: string;
  rating: number;
  avatar: string;
}

export interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export interface RecentActivity {
  id: number;
  icon: string;
  color: string;
  message: string;
  timestamp: string;
}
