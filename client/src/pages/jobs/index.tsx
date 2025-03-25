import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Job } from "@shared/schema";
import JobCard from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Search, BriefcaseBusiness } from "lucide-react";

export default function JobsIndex() {
  const { isClient } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });
  
  // Filter jobs based on search term and category
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === "all" || job.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories from jobs
  const categories = jobs 
    ? ["all", ...new Set(jobs.map(job => job.category))]
    : ["all"];
  
  // Handle loading state
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Jobs</h1>
          
          {isClient && (
            <Button asChild>
              <Link href="/jobs/post">Post a Job</Link>
            </Button>
          )}
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="w-full md:w-48">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <Skeleton className="h-7 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24 ml-2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="text-center py-12">
        <BriefcaseBusiness className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load jobs</h2>
        <p className="text-gray-600 mb-6">There was an error loading the jobs. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  // Handle empty state
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <BriefcaseBusiness className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No jobs available</h2>
        <p className="text-gray-600 mb-6">There are no jobs available at the moment.</p>
        {isClient && (
          <Button asChild>
            <Link href="/jobs/post">Post Your First Job</Link>
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Browse Jobs</h1>
        
        {isClient && (
          <Button asChild>
            <Link href="/jobs/post">Post a Job</Link>
          </Button>
        )}
      </div>
      
      {/* Search and filter controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs by title or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Jobs grid */}
      {filteredJobs && filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No matching jobs found</h2>
          <p className="text-gray-600">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
