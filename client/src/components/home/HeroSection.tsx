import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroSection() {
  const { isAuthenticated, isClient, isFreelancer } = useAuth();
  
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Connect with the perfect freelancer for your project
            </h1>
            <p className="text-xl mb-8">
              Access top talent and get high-quality work done at affordable rates.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {isAuthenticated ? (
                // Show different CTAs based on user role
                <>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                    <Link href="/dashboard">
                      {isClient ? "View My Projects" : "Find Projects"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    <Link href={isClient ? "/jobs/post" : "/profile"}>
                      {isClient ? "Post a Job" : "Complete Your Profile"}
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
          <div className="w-full md:w-1/2">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-xl">
              <svg
                className="w-full h-full text-white/10"
                viewBox="0 0 800 600"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="800" height="600" fill="currentColor" />
                <g fill="none" stroke="white" strokeWidth="2" opacity="0.2">
                  <path d="M0,100 Q400,50 800,100" />
                  <path d="M0,200 Q400,150 800,200" />
                  <path d="M0,300 Q400,250 800,300" />
                  <path d="M0,400 Q400,350 800,400" />
                  <path d="M0,500 Q400,450 800,500" />
                </g>
                <g fill="white" opacity="0.5">
                  <circle cx="200" cy="150" r="10" />
                  <circle cx="600" cy="250" r="8" />
                  <circle cx="400" cy="350" r="12" />
                  <circle cx="700" cy="400" r="7" />
                  <circle cx="100" cy="350" r="9" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
