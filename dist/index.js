// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  jobs;
  proposals;
  contracts;
  messages;
  payments;
  reviews;
  activities;
  userId;
  jobId;
  proposalId;
  contractId;
  messageId;
  paymentId;
  reviewId;
  activityId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.jobs = /* @__PURE__ */ new Map();
    this.proposals = /* @__PURE__ */ new Map();
    this.contracts = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.payments = /* @__PURE__ */ new Map();
    this.reviews = /* @__PURE__ */ new Map();
    this.activities = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.jobId = 1;
    this.proposalId = 1;
    this.contractId = 1;
    this.messageId = 1;
    this.paymentId = 1;
    this.reviewId = 1;
    this.activityId = 1;
    this.seedData();
  }
  seedData() {
    const clientUser = {
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
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
      // 30 days ago
    };
    this.users.set(clientUser.id, clientUser);
    const freelancerUser = {
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
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3)
      // 20 days ago
    };
    this.users.set(freelancerUser.id, freelancerUser);
    const adminUser = {
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
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1e3)
      // 40 days ago (earlier than other users)
    };
    this.users.set(adminUser.id, adminUser);
    const supportUser = {
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
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
    };
    this.users.set(supportUser.id, supportUser);
    const qaUser = {
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
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1e3)
    };
    this.users.set(qaUser.id, qaUser);
    const job1 = {
      id: this.jobId++,
      title: "Build a responsive e-commerce website",
      category: "Web Development",
      description: "Looking for an experienced developer to build a responsive e-commerce website with product catalog, shopping cart, and payment integration.",
      skills: ["JavaScript", "React", "CSS", "Node.js"],
      hourlyRate: null,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3),
      clientId: clientUser.id,
      budget: 2500,
      status: "open",
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
    };
    this.jobs.set(job1.id, job1);
    const job2 = {
      id: this.jobId++,
      title: "Mobile App Development - Fitness Tracker",
      category: "Mobile Development",
      description: "Need a freelancer to build a fitness tracking mobile app with workout plans, progress tracking, and social features.",
      skills: ["React Native", "Firebase", "UI/UX Design"],
      hourlyRate: 40,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3),
      clientId: clientUser.id,
      budget: null,
      status: "open",
      deadlineDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1e3)
    };
    this.jobs.set(job2.id, job2);
    const proposal1 = {
      id: this.proposalId++,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3),
      status: "pending",
      jobId: job1.id,
      freelancerId: freelancerUser.id,
      coverLetter: "I have extensive experience building e-commerce websites and would love to work on your project. I can deliver a high-quality solution within your timeframe and budget.",
      bidAmount: 2200,
      estimatedDuration: 21
    };
    this.proposals.set(proposal1.id, proposal1);
    const message1 = {
      id: this.messageId++,
      content: "Hi, I'm interested in your e-commerce website project. Do you have any specific design requirements?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3),
      jobId: job1.id,
      senderId: freelancerUser.id,
      receiverId: clientUser.id,
      read: true
    };
    this.messages.set(message1.id, message1);
    const message2 = {
      id: this.messageId++,
      content: "Yes, I'd like a modern and clean design with an emphasis on product images. Let me know if you'd like to discuss further.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3),
      jobId: job1.id,
      senderId: clientUser.id,
      receiverId: freelancerUser.id,
      read: false
    };
    this.messages.set(message2.id, message2);
  }
  // User operations
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = this.userId++;
    const now = /* @__PURE__ */ new Date();
    const user = {
      ...insertUser,
      id,
      createdAt: now,
      bio: insertUser.bio ?? null,
      avatar: insertUser.avatar ?? null,
      skills: insertUser.skills ?? null,
      hourlyRate: insertUser.hourlyRate ?? null,
      location: insertUser.location ?? null
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // Job operations
  async getJobs(limit = 10, offset = 0) {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit);
  }
  async getJobsByCategory(category) {
    return Array.from(this.jobs.values()).filter((job) => job.category === category).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getJobsByClient(clientId) {
    return Array.from(this.jobs.values()).filter((job) => job.clientId === clientId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getJob(id) {
    return this.jobs.get(id);
  }
  async createJob(insertJob, clientId) {
    const id = this.jobId++;
    const now = /* @__PURE__ */ new Date();
    const job = {
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
  async updateJob(id, jobData) {
    const job = this.jobs.get(id);
    if (!job) return void 0;
    const updatedJob = { ...job, ...jobData };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  // Proposal operations
  async getProposalsByJob(jobId) {
    return Array.from(this.proposals.values()).filter((proposal) => proposal.jobId === jobId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getProposalsByFreelancer(freelancerId) {
    return Array.from(this.proposals.values()).filter((proposal) => proposal.freelancerId === freelancerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getProposal(id) {
    return this.proposals.get(id);
  }
  async createProposal(insertProposal, freelancerId) {
    const id = this.proposalId++;
    const now = /* @__PURE__ */ new Date();
    const proposal = {
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
  async updateProposal(id, proposalData) {
    const proposal = this.proposals.get(id);
    if (!proposal) return void 0;
    const updatedProposal = { ...proposal, ...proposalData };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }
  // Contract operations
  async getContractsByJob(jobId) {
    return Array.from(this.contracts.values()).filter((contract) => contract.jobId === jobId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getContractsByClient(clientId) {
    return Array.from(this.contracts.values()).filter((contract) => contract.clientId === clientId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getContractsByFreelancer(freelancerId) {
    return Array.from(this.contracts.values()).filter((contract) => contract.freelancerId === freelancerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getContract(id) {
    return this.contracts.get(id);
  }
  async createContract(insertContract) {
    const id = this.contractId++;
    const now = /* @__PURE__ */ new Date();
    const contract = {
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
  async updateContract(id, contractData) {
    const contract = this.contracts.get(id);
    if (!contract) return void 0;
    const updatedContract = { ...contract, ...contractData };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }
  // Message operations
  async getMessagesBetweenUsers(userOneId, userTwoId, limit = 50) {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userOneId && message.receiverId === userTwoId || message.senderId === userTwoId && message.receiverId === userOneId
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(-limit);
  }
  async getMessagesByJob(jobId) {
    return Array.from(this.messages.values()).filter((message) => message.jobId === jobId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async createMessage(insertMessage) {
    const id = this.messageId++;
    const now = /* @__PURE__ */ new Date();
    const message = {
      ...insertMessage,
      id,
      read: false,
      createdAt: now,
      jobId: insertMessage.jobId ?? null
    };
    this.messages.set(id, message);
    return message;
  }
  async markMessageAsRead(id) {
    const message = this.messages.get(id);
    if (!message) return void 0;
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  // Payment operations
  async getPaymentsByContract(contractId) {
    return Array.from(this.payments.values()).filter((payment) => payment.contractId === contractId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getPayment(id) {
    return this.payments.get(id);
  }
  async createPayment(insertPayment) {
    const id = this.paymentId++;
    const now = /* @__PURE__ */ new Date();
    const payment = {
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
  async updatePayment(id, paymentData) {
    const payment = this.payments.get(id);
    if (!payment) return void 0;
    const updatedPayment = {
      ...payment,
      ...paymentData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  // Review operations
  async getReviewsByUser(userId) {
    return Array.from(this.reviews.values()).filter((review) => review.receiverId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getReviewsByContract(contractId) {
    return Array.from(this.reviews.values()).filter((review) => review.contractId === contractId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createReview(insertReview) {
    const id = this.reviewId++;
    const now = /* @__PURE__ */ new Date();
    const review = {
      ...insertReview,
      id,
      createdAt: now,
      comment: insertReview.comment ?? null
    };
    this.reviews.set(id, review);
    return review;
  }
  // Activity operations
  async getUserActivities(userId, limit = 10) {
    return Array.from(this.activities.values()).filter((activity) => activity.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
  async createActivity(insertActivity) {
    const id = this.activityId++;
    const now = /* @__PURE__ */ new Date();
    const activity = {
      ...insertActivity,
      id,
      createdAt: now,
      metadata: insertActivity.metadata ?? {}
    };
    this.activities.set(id, activity);
    return activity;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  role: text("role", { enum: ["client", "freelancer", "admin", "support", "qa"] }).notNull(),
  skills: text("skills").array(),
  hourlyRate: integer("hourly_rate"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var jobs = pgTable("jobs", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  clientId: true,
  status: true,
  createdAt: true
});
var proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  coverLetter: text("cover_letter").notNull(),
  bidAmount: integer("bid_amount").notNull(),
  estimatedDuration: integer("estimated_duration"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  freelancerId: true,
  status: true,
  createdAt: true
});
var contracts = pgTable("contracts", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  status: true,
  startDate: true,
  createdAt: true
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true
});
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "held", "released", "refunded"] }).notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});
var activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", {
    enum: [
      "job_posted",
      "proposal_submitted",
      "message_sent",
      "contract_created",
      "payment_released",
      "review_submitted"
    ]
  }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const handleError = (err, res) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };
  const requireAuth = async (req, res, next) => {
    const userId = req.headers["user-id"] ? Number(req.headers["user-id"]) : null;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  };
  const checkRole = (role) => {
    return (req, res, next) => {
      const user = req.user;
      if (user.role !== role) {
        return res.status(403).json({ message: `Only ${role}s can access this endpoint` });
      }
      next();
    };
  };
  const requireAdmin = async (req, res, next) => {
    try {
      const userId = req.headers["user-id"] ? Number(req.headers["user-id"]) : null;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }
      req.user = user;
      next();
    } catch (error) {
      handleError(error, res);
    }
  };
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Email/username and password are required" });
      }
      const isEmail = username.includes("@");
      let user;
      if (isEmail) {
        user = await storage.getUserByEmail(username);
      } else {
        user = await storage.getUserByUsername(username);
      }
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.setHeader("X-User-ID", user.id.toString());
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = req.user;
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
  app2.get("/api/jobs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const jobs2 = await storage.getJobs(limit, offset);
      res.json(jobs2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/jobs/category/:category", async (req, res) => {
    try {
      const jobs2 = await storage.getJobsByCategory(req.params.category);
      res.json(jobs2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/jobs/:id", async (req, res) => {
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
  app2.post("/api/jobs", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = req.user;
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData, user.id);
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
  app2.patch("/api/jobs/:id", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = req.user;
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
  app2.get("/api/jobs/:jobId/proposals", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (job.clientId !== user.id && user.role !== "freelancer") {
        return res.status(403).json({ message: "Not authorized to view these proposals" });
      }
      const proposals2 = await storage.getProposalsByJob(jobId);
      if (user.role === "freelancer") {
        const ownProposals = proposals2.filter((p) => p.freelancerId === user.id);
        return res.json(ownProposals);
      }
      res.json(proposals2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/jobs/:jobId/proposals", requireAuth, checkRole("freelancer"), async (req, res) => {
    try {
      const user = req.user;
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (job.status !== "open") {
        return res.status(400).json({ message: "Cannot submit proposal for a closed job" });
      }
      const existingProposals = await storage.getProposalsByJob(jobId);
      const alreadyApplied = existingProposals.some((p) => p.freelancerId === user.id);
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already submitted a proposal for this job" });
      }
      const proposalData = insertProposalSchema.parse({
        ...req.body,
        jobId
      });
      const proposal = await storage.createProposal(proposalData, user.id);
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
  app2.patch("/api/proposals/:id", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = req.user;
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
  app2.post("/api/contracts", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = req.user;
      const contractData = insertContractSchema.parse(req.body);
      const proposal = await storage.getProposal(contractData.proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      const job = await storage.getJob(proposal.jobId);
      if (!job || job.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to create this contract" });
      }
      const contract = await storage.createContract({
        ...contractData,
        clientId: user.id,
        freelancerId: proposal.freelancerId,
        jobId: job.id
      });
      await storage.updateJob(job.id, { status: "in_progress" });
      await storage.updateProposal(proposal.id, { status: "accepted" });
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
  app2.get("/api/contracts/me", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      let contracts2;
      if (user.role === "client") {
        contracts2 = await storage.getContractsByClient(user.id);
      } else {
        contracts2 = await storage.getContractsByFreelancer(user.id);
      }
      res.json(contracts2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.patch("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      if (contract.clientId !== user.id && contract.freelancerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this contract" });
      }
      if (req.body.status === "completed" && user.role !== "client") {
        return res.status(403).json({ message: "Only clients can mark contracts as completed" });
      }
      const updatedContract = await storage.updateContract(contractId, req.body);
      if (updatedContract?.status === "completed") {
        await storage.updateJob(contract.jobId, { status: "completed" });
      }
      res.json(updatedContract);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/messages/:userId", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const otherUserId = parseInt(req.params.userId);
      const messages2 = await storage.getMessagesBetweenUsers(user.id, otherUserId);
      res.json(messages2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: user.id
      });
      const message = await storage.createMessage(messageData);
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
  app2.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const messageId = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      if (message.receiverId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this message" });
      }
      res.json(message);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/payments", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = req.user;
      const paymentData = insertPaymentSchema.parse(req.body);
      const contract = await storage.getContract(paymentData.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      if (contract.clientId !== user.id) {
        return res.status(403).json({ message: "Not authorized to make payments for this contract" });
      }
      const payment = await storage.createPayment(paymentData);
      const updatedPayment = await storage.updatePayment(payment.id, { status: "held" });
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
  app2.patch("/api/payments/:id/release", requireAuth, checkRole("client"), async (req, res) => {
    try {
      const user = req.user;
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
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = /* @__PURE__ */ new Map();
      for (let i = 1; i <= 100; i++) {
        const user = await storage.getUser(i);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          allUsers.set(user.id, userWithoutPassword);
        }
      }
      res.json(Array.from(allUsers.values()));
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/admin/jobs", requireAdmin, async (req, res) => {
    try {
      const jobs2 = await storage.getJobs(100, 0);
      res.json(jobs2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/admin/proposals", requireAdmin, async (req, res) => {
    try {
      const jobs2 = await storage.getJobs(100, 0);
      const allProposals = [];
      for (const job of jobs2) {
        const proposals2 = await storage.getProposalsByJob(job.id);
        allProposals.push(...proposals2);
      }
      res.json(allProposals);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/admin/contracts", requireAdmin, async (req, res) => {
    try {
      const jobs2 = await storage.getJobs(100, 0);
      const allContracts = [];
      for (const job of jobs2) {
        const contracts2 = await storage.getContractsByJob(job.id);
        allContracts.push(...contracts2);
      }
      res.json(allContracts);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const jobs2 = await storage.getJobs(5, 0);
      const allReports = [];
      for (const job of jobs2) {
        const client = await storage.getUser(job.clientId);
        if (client) {
          const messages2 = await storage.getMessagesByJob(job.id);
          if (messages2.length > 0) {
            allReports.push({
              ...messages2[0],
              reportType: "message",
              reportedBy: client.id,
              status: "pending",
              createdAt: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      res.json(allReports);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updateUserSchema = z.object({
        role: z.enum(["client", "freelancer", "admin", "support", "qa"])
      });
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.patch("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
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
  app2.patch("/api/admin/proposals/:id", requireAdmin, async (req, res) => {
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
  app2.patch("/api/admin/contracts/:id", requireAdmin, async (req, res) => {
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
  app2.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: user.id
      });
      const contract = await storage.getContract(reviewData.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      if (contract.clientId !== user.id && contract.freelancerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to review this contract" });
      }
      let receiverId;
      if (user.id === contract.clientId) {
        receiverId = contract.freelancerId;
      } else {
        receiverId = contract.clientId;
      }
      const review = await storage.createReview({
        ...reviewData,
        receiverId
      });
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
  app2.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews2 = await storage.getReviewsByUser(userId);
      res.json(reviews2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const activities2 = await storage.getUserActivities(user.id, limit);
      res.json(activities2);
    } catch (err) {
      handleError(err, res);
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
