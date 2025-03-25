import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model supporting all user roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  role: text("role", { 
    enum: ["client", "freelancer", "admin", "support", "qa", "dispute_resolution", "accounts"] 
  }).notNull(),
  skills: text("skills").array(),
  hourlyRate: integer("hourly_rate"),
  location: text("location"),
  walletBalance: integer("wallet_balance").default(0).notNull(),
  permissions: jsonb("permissions"), // Flexible permissions structure
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Job Postings
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clientId: integer("client_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  skills: text("skills").array(),
  budget: integer("budget"),
  hourlyRate: doublePrecision("hourly_rate"),
  status: text("status", { enum: ["open", "in_progress", "completed", "canceled"] }).notNull().default("open"),
  deadlineDate: timestamp("deadline_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  clientId: true,
  status: true,
  createdAt: true,
});

// Proposals (bids) from freelancers
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  coverLetter: text("cover_letter").notNull(),
  bidAmount: integer("bid_amount").notNull(),
  estimatedDuration: integer("estimated_duration"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  freelancerId: true,
  status: true,
  createdAt: true,
});

// Contracts
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id),
  terms: text("terms").notNull(),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["active", "completed", "canceled"] }).notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  status: true,
  startDate: true,
  createdAt: true,
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Payments (escrow system)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "held", "released", "refunded"] }).notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Wallet transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type", { 
    enum: ["deposit", "withdrawal", "escrow_hold", "escrow_release", "refund", "system_adjustment"] 
  }).notNull(),
  status: text("status", { 
    enum: ["pending", "completed", "failed", "processing"] 
  }).notNull().default("pending"),
  description: text("description"),
  reference: text("reference"), // External payment reference (e.g., PesaPal transaction ID)
  metadata: jsonb("metadata"), // Additional data related to the transaction
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  status: true,
  createdAt: true,
  completedAt: true,
});

// Escrow accounts (holds funds during contract execution)
export const escrowAccounts = pgTable("escrow_accounts", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id).unique(),
  amount: integer("amount").notNull().default(0),
  status: text("status", { 
    enum: ["active", "released", "refunded", "disputed"] 
  }).notNull().default("active"),
  supervisorId: integer("supervisor_id").references(() => users.id), // QA or admin supervising
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertEscrowAccountSchema = createInsertSchema(escrowAccounts).omit({
  id: true,
  amount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { 
    enum: ["job_posted", "proposal_submitted", "message_sent", "contract_created", 
           "payment_released", "review_submitted", "wallet_deposit", "wallet_withdrawal",
           "escrow_created", "escrow_released", "escrow_disputed"] 
  }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;

export type EscrowAccount = typeof escrowAccounts.$inferSelect;
export type InsertEscrowAccount = z.infer<typeof insertEscrowAccountSchema>;

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { 
    enum: ["support", "complaint", "bug", "feature", "other"] 
  }).notNull(),
  priority: text("priority", { 
    enum: ["low", "medium", "high", "critical"] 
  }).notNull().default("medium"),
  status: text("status", { 
    enum: ["new", "in_progress", "pending", "resolved", "closed"] 
  }).notNull().default("new"),
  userId: integer("user_id").notNull().references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  contractId: integer("contract_id").references(() => contracts.id),
  jobId: integer("job_id").references(() => jobs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  status: true,
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

// Dispute resolution
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { 
    enum: ["pending", "reviewing", "mediation", "resolved", "closed"] 
  }).notNull().default("pending"),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id), // Assigned dispute resolver
  resolution: text("resolution"),
  clientEvidence: jsonb("client_evidence"),
  freelancerEvidence: jsonb("freelancer_evidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  status: true,
  assignedToId: true,
  resolution: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

// Permissions for role-based access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role", { 
    enum: ["client", "freelancer", "admin", "support", "qa", "dispute_resolution", "accounts"] 
  }).notNull(),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User sessions (for hybrid auth)
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivity: timestamp("last_activity"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System configuration
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: text("value").notNull(),
  type: text("type", { enum: ["string", "number", "boolean", "json"] }).notNull(),
  description: text("description"),
  updatedById: integer("updated_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Audit logs for security and compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  detail: jsonb("detail"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "success", "warning", "error"] }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Type definitions for all entities
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;

export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type UserSession = typeof userSessions.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
