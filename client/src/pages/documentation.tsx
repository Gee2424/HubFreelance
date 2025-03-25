import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Documentation() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Platform guide, features, and customization options
        </p>
        <Separator className="my-6" />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 pb-4">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground relative">
            <TabsTrigger
              value="overview"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Features
            </TabsTrigger>
            <TabsTrigger
              value="getting-started"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Getting Started
            </TabsTrigger>
            <TabsTrigger
              value="tech"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Tech Stack
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              API Reference
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>
                Learn about our freelancing platform and its core features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                FreelanceHub is a comprehensive platform designed to connect talented professionals
                with clients worldwide. Our platform provides all the tools needed for successful
                freelance collaborations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">For Clients</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Post detailed job requirements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Review freelancer proposals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Secure payment protection</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">For Freelancers</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Find relevant projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Submit competitive proposals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Build professional reputation</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">For Admins</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Comprehensive platform management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>User moderation and oversight</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Dispute resolution tools</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">For Support</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Assist users with platform questions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Provide onboarding guidance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Handle routine user inquiries</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">For QA</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Test platform functionality</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Report bugs and issues</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Verify feature implementations</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Platform Architecture</CardTitle>
                  <CardDescription>
                    High-level overview of the application structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Project Structure</h3>
                      <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-auto">
                        <pre>{`/
├── client/             # Frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── server/             # Backend application
│   ├── index.ts        # Express server setup
│   ├── routes.ts       # API routes definition
│   └── storage.ts      # Database interaction layer
└── shared/             # Shared code
    └── schema.ts       # Database schema and types`}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Request Flow</h3>
                      <ol className="list-decimal ml-6 space-y-2">
                        <li>User interacts with the React frontend</li>
                        <li>Frontend makes API requests using TanStack Query</li>
                        <li>Express backend receives and processes requests</li>
                        <li>Storage layer interacts with database (Supabase/PostgreSQL)</li>
                        <li>Response flows back to the user interface</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="features"
          className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Core Features</CardTitle>
              <CardDescription>
                Detailed explanation of platform capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="user-management">
                  <AccordionTrigger>User Management</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      The platform supports five distinct user roles, each with specific permissions and interfaces:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Clients:</strong> Post jobs, review proposals, manage contracts, release payments
                      </li>
                      <li>
                        <strong>Freelancers:</strong> Search jobs, submit proposals, complete work, receive payments
                      </li>
                      <li>
                        <strong>Admins:</strong> Moderate content, manage users, resolve disputes, oversee platform
                      </li>
                      <li>
                        <strong>Support:</strong> Assist users with platform questions, guide new users, provide help
                      </li>
                      <li>
                        <strong>QA:</strong> Test platform features, report bugs, verify functionality, improve quality
                      </li>
                    </ul>
                    <p className="mt-2">
                      User profiles include customizable details like skills, portfolio links, hourly rates, and more.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="job-marketplace">
                  <AccordionTrigger>Job Marketplace</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      The job marketplace is the core of the platform, facilitating connections between clients and freelancers:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Job Posting:</strong> Clients can create detailed job listings with specific requirements, budget, and timeframe
                      </li>
                      <li>
                        <strong>Job Discovery:</strong> Freelancers can browse, search, and filter available jobs by category, skills, or budget
                      </li>
                      <li>
                        <strong>Proposal System:</strong> Freelancers submit detailed proposals with custom cover letters and bid amounts
                      </li>
                      <li>
                        <strong>Selection Process:</strong> Clients review proposals, communicate with candidates, and select the best fit
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contracts">
                  <AccordionTrigger>Contract Management</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      Once a client accepts a freelancer's proposal, a contract is formed:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Contract Creation:</strong> Automatically generated with agreed-upon terms
                      </li>
                      <li>
                        <strong>Milestone System:</strong> Projects can be broken down into manageable milestones
                      </li>
                      <li>
                        <strong>Status Tracking:</strong> Monitor progress through active, completed, or canceled states
                      </li>
                      <li>
                        <strong>Contract Management:</strong> Both parties can view, update, and manage their contracts
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="messaging">
                  <AccordionTrigger>Messaging System</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      Seamless communication is essential for successful collaboration:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Direct Messaging:</strong> Private conversations between clients and freelancers
                      </li>
                      <li>
                        <strong>Job-Specific Chats:</strong> Discussions tied to particular job listings
                      </li>
                      <li>
                        <strong>Real-time Updates:</strong> Instant message delivery and notifications
                      </li>
                      <li>
                        <strong>History:</strong> Complete message history preserved for reference
                      </li>
                    </ul>
                    <p className="mt-2">
                      Files and attachments can be shared to facilitate project collaboration.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payments">
                  <AccordionTrigger>Payment System</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      Secure, fair payments are handled through an escrow-like system:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Escrow Protection:</strong> Client funds are held securely until work is approved
                      </li>
                      <li>
                        <strong>Milestone Payments:</strong> Release partial payments as milestones are completed
                      </li>
                      <li>
                        <strong>Transaction History:</strong> Complete record of all financial interactions
                      </li>
                      <li>
                        <strong>Dispute Resolution:</strong> Fair process for handling payment disagreements
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reviews">
                  <AccordionTrigger>Rating & Reviews</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      Build trust and reputation through transparent feedback:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Two-way Reviews:</strong> Both clients and freelancers can rate each other
                      </li>
                      <li>
                        <strong>Detailed Feedback:</strong> Numerical ratings and written testimonials
                      </li>
                      <li>
                        <strong>Performance Metrics:</strong> Track success rates, on-time delivery, and more
                      </li>
                      <li>
                        <strong>Public Profiles:</strong> Reviews contribute to user reputation and visibility
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="getting-started"
          className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Getting Started Guide</CardTitle>
              <CardDescription>
                Follow these steps to start using our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This section will provide a step-by-step guide on how to get started with the FreelanceHub platform.  It will cover registration, profile creation, job searching, and more.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="tech"
          className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
              <CardDescription>
                Overview of the technologies powering our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-3">Frontend Technologies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Core Libraries</h4>
                    <Separator className="my-2" />
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>React</span>
                        <span className="text-muted-foreground">UI Library</span>
                      </li>
                      <li className="flex justify-between">
                        <span>TypeScript</span>
                        <span className="text-muted-foreground">Type Safety</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Vite</span>
                        <span className="text-muted-foreground">Build Tool</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Wouter</span>
                        <span className="text-muted-foreground">Routing</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Data Management</h4>
                    <Separator className="my-2" />
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>TanStack Query</span>
                        <span className="text-muted-foreground">Data Fetching</span>
                      </li>
                      <li className="flex justify-between">
                        <span>React Hook Form</span>
                        <span className="text-muted-foreground">Form Handling</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Zod</span>
                        <span className="text-muted-foreground">Validation</span>
                      </li>
                      <li className="flex justify-between">
                        <span>React Context</span>
                        <span className="text-muted-foreground">State Management</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">UI Components</h4>
                    <Separator className="my-2" />
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Tailwind CSS</span>
                        <span className="text-muted-foreground">Styling</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Shadcn UI</span>
                        <span className="text-muted-foreground">Component Library</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Radix UI</span>
                        <span className="text-muted-foreground">Primitives</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Lucide React</span>
                        <span className="text-muted-foreground">Icons</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Data Visualization</h4>
                    <Separator className="my-2" />
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Recharts</span>
                        <span className="text-muted-foreground">Charts</span>
                      </li>
                      <li className="flex justify-between">
                        <span>date-fns</span>
                        <span className="text-muted-foreground">Date Handling</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-3">Backend Technologies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Server Framework</h4>
                    <Separator className="my-2" />
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Node.js</span>
                        <span className="text-muted-foreground">Runtime</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Express.js</span>
                        <span className="text-muted-foreground">Web Framework</span>
                      </li>
                      <li className="flex justify-between">
                        <span>TypeScript</span>
                        <span className="text-muted-foreground">Type Safety</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Database</h4>
                    <Separator className="my-2" />
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>PostgreSQL</span>
                        <span className="text-muted-foreground">Database</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Drizzle ORM</span>
                        <span className="text-muted-foreground">ORM</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Supabase</span>
                        <span className="text-muted-foreground">Backend as a Service</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="api"
          className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Customization Guide</CardTitle>
              <CardDescription>How to modify and extend the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-feature">
                  <AccordionTrigger>Adding New Features</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>To add a new feature to the platform, follow these steps:</p>

                    <ol className="list-decimal ml-6 space-y-2">
                      <li>
                        <p className="font-medium">Update Database Schema</p>
                        <p className="text-sm text-muted-foreground">
                          Start by defining any new database tables in{" "}
                          <code className="bg-muted p-1 rounded">
                            shared/schema.ts
                          </code>
                          . Create both the table definition and the insert schema.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Storage Implementation</p>
                        <p className="text-sm text-muted-foreground">
                          Add new methods to the storage interface in{" "}
                          <code className="bg-muted p-1 rounded">
                            server/storage.ts
                          </code>{" "}
                          to handle database interactions.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">API Endpoints</p>
                        <p className="text-sm text-muted-foreground">
                          Create new routes in{" "}
                          <code className="bg-muted p-1 rounded">
                            server/routes.ts
                          </code>{" "}
                          to expose the functionality via REST API.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Frontend Integration</p>
                        <p className="text-sm text-muted-foreground">
                          Add API client functions and React components to implement the UI for the new feature.
                        </p>
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="styling">
                  <AccordionTrigger>Styling and Theming</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>The platform's appearance can be customized in several ways:</p>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>
                        <p className="font-medium">Theme Configuration</p>
                        <p className="text-sm text-muted-foreground">
                          Edit the{" "}
                          <code className="bg-muted p-1 rounded">theme.json</code>{" "}
                          file to change the primary color, radius, variant, and appearance.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Component Styling</p>
                        <p className="text-sm text-muted-foreground">
                          Use Tailwind utility classes to style components directly in their JSX.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Custom Components</p>
                        <p className="text-sm text-muted-foreground">
                          Create new UI components in{" "}
                          <code className="bg-muted p-1 rounded">
                            client/src/components/ui
                          </code>{" "}
                          following the Shadcn pattern.
                        </p>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deployment">
                  <AccordionTrigger>Deployment Options</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>The application can be deployed in various environments:</p>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>
                        <p className="font-medium">Replit Deployments</p>
                        <p className="text-sm text-muted-foreground">
                          Use the built-in Replit Deployments for the simplest hosting option.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Traditional Hosting</p>
                        <p className="text-sm text-muted-foreground">
                          The Express backend can be deployed to any Node.js hosting service, while the React frontend
                          can be built and deployed to static hosting services.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Database Configuration</p>
                        <p className="text-sm text-muted-foreground">
                          Update database connection details in environment variables for production deployments.
                        </p>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="extend-auth">
                  <AccordionTrigger>Extending Authentication</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>The authentication system can be extended in several ways:</p>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>
                        <p className="font-medium">OAuth Integration</p>
                        <p className="text-sm text-muted-foreground">
                          Add support for Google, GitHub, or other OAuth providers through Supabase Auth.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Enhanced Security</p>
                        <p className="text-sm text-muted-foreground">
                          Implement two-factor authentication, email verification, or password policies.
                        </p>
                      </li>

                      <li>
                        <p className="font-medium">Custom User Roles</p>
                        <p className="text-sm text-muted-foreground">
                          Add new roles by updating the UserRole type and associated permission logic.
                        </p>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}