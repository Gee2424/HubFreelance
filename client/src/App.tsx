import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";

// Layouts
import AuthLayout from "@/components/layouts/AuthLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import JobsIndex from "@/pages/jobs/index";
import JobPost from "@/pages/jobs/post";
import JobDetail from "@/pages/jobs/[id]";
import ProposalsIndex from "@/pages/proposals/index";
import MessagesIndex from "@/pages/messages/index";
import WalletIndex from "@/pages/wallet/index";
import ProfileIndex from "@/pages/profile/index";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Documentation from "@/pages/documentation";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login">
        {() => (
          <AuthLayout>
            <Login />
          </AuthLayout>
        )}
      </Route>
      <Route path="/signup">
        {() => (
          <AuthLayout>
            <Signup />
          </AuthLayout>
        )}
      </Route>

      {/* Private/Dashboard Routes */}
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/jobs">
        {() => (
          <DashboardLayout>
            <JobsIndex />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/jobs/post">
        {() => (
          <DashboardLayout>
            <JobPost />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/jobs/:id">
        {(params) => (
          <DashboardLayout>
            <JobDetail id={params.id} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/proposals">
        {() => (
          <DashboardLayout>
            <ProposalsIndex />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/messages">
        {() => (
          <DashboardLayout>
            <MessagesIndex />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/wallet">
        {() => (
          <DashboardLayout>
            <WalletIndex />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <DashboardLayout>
            <ProfileIndex />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/documentation">
        {() => (
          <DashboardLayout>
            <Documentation />
          </DashboardLayout>
        )}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <Router />
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
