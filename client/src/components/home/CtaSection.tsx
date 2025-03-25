import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function CtaSection() {
  const { isAuthenticated, isClient, isFreelancer } = useAuth();
  
  return (
    <section id="pricing" className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform the way you work?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of clients and freelancers who are changing the way work gets done.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {isAuthenticated ? (
              // Show different CTAs based on user role
              <>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                  <Link href={isClient ? "/jobs/post" : "/jobs"}>
                    {isClient ? "Post a New Job" : "Browse Available Jobs"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              // Show default CTAs for non-authenticated users
              <>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                  <Link href="/signup?role=client">Hire a Freelancer</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <Link href="/signup?role=freelancer">Find Work</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
