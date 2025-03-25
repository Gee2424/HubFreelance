import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/dashboard/StatCard";
import RecentJobs from "@/components/dashboard/RecentJobs";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentMessages from "@/components/dashboard/RecentMessages";
import AdminPanel from "@/components/admin/AdminPanel";
import { StatCard as StatCardType } from "@/types";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isClient, isFreelancer, isAdmin } = useAuth();
  
  // If user is admin, render the admin panel instead
  if (isAdmin) {
    return <AdminPanel />;
  }
  
  // Different stats based on user role
  const clientStats: StatCardType[] = [
    { title: "Active Jobs", value: "5", icon: "briefcase", color: "blue" },
    { title: "Total Spent", value: "$1,245", icon: "dollar-sign", color: "green" },
    { title: "Pending Proposals", value: "12", icon: "file-alt", color: "indigo" },
    { title: "Average Rating", value: "4.9/5", icon: "star", color: "yellow" },
  ];
  
  const freelancerStats: StatCardType[] = [
    { title: "Active Projects", value: "3", icon: "briefcase", color: "blue" },
    { title: "Earnings", value: "$2,780", icon: "dollar-sign", color: "green" },
    { title: "Proposals Sent", value: "8", icon: "file-alt", color: "indigo" },
    { title: "Client Rating", value: "4.8/5", icon: "star", color: "yellow" },
  ];
  
  // Use appropriate stats based on user role
  const stats = isClient ? clientStats : freelancerStats;
  
  return (
    <div>
      {/* Welcome message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user?.fullName || user?.username || 'User'}
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your {isClient ? 'projects' : 'freelancing'} today.
        </p>
      </div>
      
      {/* Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        {isClient && (
          <Button asChild>
            <Link href="/jobs/post">Post a New Job</Link>
          </Button>
        )}
        {isFreelancer && (
          <Button asChild>
            <Link href="/jobs">Find New Projects</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/messages">Messages</Link>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>
      
      {/* Recent Jobs */}
      <div className="mb-8">
        <RecentJobs />
      </div>
      
      {/* Activity & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity />
        <RecentMessages />
      </div>
    </div>
  );
}
