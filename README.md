# FreelanceHub - Freelancing Marketplace Platform

## Overview

FreelanceHub is a full-stack freelancing marketplace platform that connects clients with freelancers. It provides features for job posting, bidding on projects, real-time messaging, secure payments, and comprehensive user management. The platform is built with modern web technologies and follows best practices for scalability, security, and user experience.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [Authentication System](#authentication-system)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [How to Customize](#how-to-customize)
9. [Development Guidelines](#development-guidelines)
10. [Deployment](#deployment)

## Technology Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **TypeScript** - Type safety and enhanced developer experience
- **Drizzle ORM** with **PostgreSQL** - Database management and schema definition
- **Supabase** - Authentication, database, and storage services
- **Zod** - Runtime validation for request/response data

### Frontend
- **React** - UI library
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Build tool and development server
- **TanStack Query (React Query)** - Data fetching, caching, and state management
- **React Hook Form** with **Zod** - Form validation
- **Wouter** - Lightweight routing
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Component library based on Radix UI
- **Lucide React** - Icon library
- **React Icons** - Additional icon library
- **Recharts** - Data visualization components

## Project Structure

The project is organized into three main sections:

```
/
├── client/             # Frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions and configurations
│   │   ├── pages/      # Page components for routing
│   │   └── types.ts    # TypeScript interfaces for frontend
│   └── index.html      # HTML entry point
├── server/             # Backend application
│   ├── index.ts        # Express server setup
│   ├── routes.ts       # API routes definition
│   ├── storage.ts      # Database interaction layer
│   └── vite.ts         # Vite integration for development
├── shared/             # Shared code between frontend and backend
│   └── schema.ts       # Database schema and type definitions
└── package.json        # Project dependencies and scripts
```

## Core Features

### User Management
- User registration and authentication with role-based access control
- Three user roles: Client, Freelancer, and Admin
- Detailed user profiles with skills, reviews, and portfolios

### Job Marketplace
- Clients can post jobs with detailed requirements, budget, and deadlines
- Freelancers can search and filter jobs by category, budget range, etc.
- Proposal submission system for freelancers with cover letters and bid amounts

### Contract Management
- Creation of contracts upon acceptance of proposals
- Milestone-based payment system
- Contract status tracking (active, completed, canceled)

### Messaging System
- Real-time messaging between clients and freelancers
- Job-specific conversations
- Message notifications

### Payment Processing
- Secure payment handling through escrow-like system
- Release of funds upon milestone completion
- Transaction history and reporting

### Admin Panel
- Comprehensive admin dashboard for site management
- User administration with moderation capabilities
- Job and contract oversight
- Report handling and dispute resolution

## Authentication System

FreelanceHub uses a dual authentication system:

1. **Supabase Authentication** (Primary) - When Supabase credentials are available
2. **Custom Auth** (Fallback) - In-memory authentication for development

### Authentication Flow:
1. Users register with email, password, and select a role (client or freelancer)
2. Login can be performed using either email or username + password
3. Upon successful authentication, user data is stored in React context and localStorage
4. Protected routes check auth status via the `useAuth` hook

### Test Accounts:
- **Admin**: admin@example.com / password123
- **Client**: client@example.com / password123
- **Freelancer**: freelancer@example.com / password123

## Database Schema

The application uses Drizzle ORM with PostgreSQL for data management. Key models include:

### Users
- Basic info: username, email, fullName, password (hashed)
- Role: client, freelancer, or admin
- Profile details: bio, avatar, skills, hourlyRate, location

### Jobs
- Details: title, description, category, skills
- Financial: budget or hourlyRate
- Status: open, in_progress, completed, canceled
- Relationships: clientId (creator)

### Proposals
- Core info: coverLetter, bidAmount, estimatedDuration
- Status: pending, accepted, rejected
- Relationships: jobId, freelancerId

### Contracts
- Terms: startDate, endDate, paymentTerms
- Status: active, completed, canceled
- Relationships: jobId, clientId, freelancerId

### Messages
- Content: text content, timestamp
- Status: read/unread
- Relationships: senderId, receiverId, jobId (optional)

### Additional Models
- Payments, Reviews, Activities, and more

## API Documentation

The backend provides a RESTful API with the following key endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get current user profile

### Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get a specific job
- `POST /api/jobs` - Create a new job
- `PATCH /api/jobs/:id` - Update a job
- `GET /api/jobs/category/:category` - Get jobs by category
- `GET /api/jobs/client/:clientId` - Get jobs posted by a client

### Proposals
- `GET /api/proposals/job/:jobId` - Get proposals for a job
- `GET /api/proposals/freelancer/:freelancerId` - Get proposals by a freelancer
- `POST /api/proposals` - Submit a new proposal
- `PATCH /api/proposals/:id` - Update a proposal status

### Contracts
- `GET /api/contracts/job/:jobId` - Get contracts for a job
- `GET /api/contracts/client/:clientId` - Get client's contracts
- `GET /api/contracts/freelancer/:freelancerId` - Get freelancer's contracts
- `POST /api/contracts` - Create a new contract
- `PATCH /api/contracts/:id` - Update a contract status

### Messages
- `GET /api/messages` - Get messages between users
- `POST /api/messages` - Send a new message
- `PATCH /api/messages/:id/read` - Mark a message as read

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/jobs` - Get all jobs (admin only)
- `GET /api/admin/reports` - Get all reported content (admin only)

## Frontend Components

### Page Structure
- Home page with platform overview and CTAs
- Authentication pages (login, signup)
- Dashboard with role-specific views
- Job listing and detail pages
- Profile management
- Messaging interface
- Admin panel

### UI Components
- The application uses Shadcn UI components built on top of Radix UI
- Custom components for specific platform features:
  - JobCard, ProposalForm, ContractView
  - ChatInterface, PaymentForm
  - AdminPanel, Metrics and charts

### State Management
- React Context for global state (auth, theme)
- TanStack Query for server state management
- React Hook Form for form state

## How to Customize

### Adding New Features

1. **Update the Schema:** Start by modifying the `shared/schema.ts` file to define any new tables or fields
2. **Backend Implementation:** 
   - Add new methods to the storage interface in `server/storage.ts`
   - Create new API endpoints in `server/routes.ts`
3. **Frontend Integration:**
   - Add new API client functions in `client/src/lib/queryClient.ts`
   - Create React components for the feature
   - Add routes in `client/src/App.tsx`

### Styling Customization

1. **Theme:** Modify the `theme.json` file to update the color scheme
2. **Component Styling:** Use the Tailwind utility classes for component styling
3. **Layout:** Adjust layouts in the component files

### Adding New User Roles

1. Update the `UserRole` type in `shared/schema.ts`
2. Modify the authentication system in `client/src/contexts/AuthContext.tsx`
3. Update route permissions in `server/routes.ts`
4. Add role-specific UI in relevant components

## Development Guidelines

### Best Practices

1. **Types First:** Always define types before implementing functionality
2. **API Response Patterns:** Use consistent response patterns (data, error handling)
3. **Component Structure:** Keep components small and focused on a single responsibility
4. **State Management:** Use the appropriate state management approach based on scope:
   - Local state with useState for component-specific state
   - Context API for global state like auth
   - TanStack Query for server state

### Common Pitfalls

1. **Error Handling:** Always include proper error handling, especially for API calls
2. **Authentication:** Check user roles before displaying sensitive UI or making protected API calls
3. **Form Validation:** Use Zod schemas for consistent validation across frontend and backend
4. **API TypeSafety:** Make sure API response types match backend return types

## Deployment

The application is designed to be deployed on various platforms:

1. **Replit Deployments:** The simplest option with integrated hosting
2. **Docker:** The project can be containerized for deployment on container orchestration platforms
3. **Traditional Hosting:**
   - Backend: Node.js hosting (Heroku, Digital Ocean, AWS)
   - Frontend: Static hosting (Netlify, Vercel, AWS S3)
4. **Database:** The application works with PostgreSQL databases (including Supabase)

## Extending the Platform

### Integration with External Services

1. **Payment Processors:** Integrate with Stripe, PayPal, etc.
2. **File Storage:** Add Supabase Storage or AWS S3 for file uploads
3. **Email Notifications:** Add email service (SendGrid, Mailgun)
4. **Analytics:** Integrate with Google Analytics or custom analytics solutions

### Mobile Applications

The backend API is designed to support multiple clients, including:
1. Mobile apps built with React Native
2. Native mobile apps consuming the same API endpoints

---

This documentation provides an overview of the FreelanceHub platform, its architecture, and guidelines for modification. For detailed implementation specifics, refer to the code and inline comments.

For further assistance or contributions, please check the project repository or contact the development team.