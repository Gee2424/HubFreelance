import { Link } from "wouter";
import { UserPlus, Search, Handshake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  const steps = [
    {
      Icon: UserPlus,
      title: "1. Create Your Profile",
      description: "Sign up and create a detailed profile showcasing your skills, experience, and portfolio."
    },
    {
      Icon: Search,
      title: "2. Find Work or Talent",
      description: "Browse job listings or post your project to find the perfect match for your needs."
    },
    {
      Icon: Handshake,
      title: "3. Collaborate Securely",
      description: "Use our platform for communication, file sharing, and secure milestone payments."
    },
    {
      Icon: Star,
      title: "4. Complete & Review",
      description: "Finalize the project, release payment, and leave feedback to build your reputation."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">How FreelanceHub Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform makes it easy to find work or hire quality talent. Follow these simple steps to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <step.Icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link href="/signup">Get Started Today</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}