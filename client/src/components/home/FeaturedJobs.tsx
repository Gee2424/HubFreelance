import { useQuery } from "@tanstack/react-query";
import JobCard from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Job } from "@shared/schema";

export default function FeaturedJobs() {
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    staleTime: 60000, // 1 minute
  });
  
  // Handle loading state
  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Featured Jobs</h2>
            <Link href="/jobs" className="text-primary font-medium hover:underline">
              View All Jobs
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
      </section>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Featured Jobs</h2>
          <p className="text-red-500">Failed to load jobs. Please try again later.</p>
        </div>
      </section>
    );
  }
  
  // Show empty state if no jobs
  if (!jobs || jobs.length === 0) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Featured Jobs</h2>
          <p className="text-gray-500">No jobs available at the moment. Check back later!</p>
        </div>
      </section>
    );
  }
  
  // Show only a few featured jobs
  const featuredJobs = jobs.slice(0, 3);
  
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold">Featured Jobs</h2>
          <Link href="/jobs" className="text-primary font-medium hover:underline">
            View All Jobs
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}
