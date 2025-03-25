import { Testimonial } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";

// Mock testimonials (in a real app, this would come from the API)
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "CEO",
    company: "Digital Innovations",
    comment: "FreelanceHub has been a game-changer for my business. I've been able to find top-notch developers consistently, and the platform makes collaboration seamless.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/45.jpg"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "UI/UX Designer",
    company: "",
    comment: "As a freelance designer, I've doubled my income since joining FreelanceHub. The quality of clients and the secure payment system gives me peace of mind with every project.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 3,
    name: "Robert Garcia",
    role: "CTO",
    company: "TechStart Solutions",
    comment: "The talent pool on FreelanceHub is exceptional. We've built our entire remote development team through the platform and the quality of work has been consistently outstanding.",
    rating: 4.5,
    avatar: "https://randomuser.me/api/portraits/men/76.jpg"
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied clients and freelancers who have found success on our platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className="h-4 w-4"
                      fill={i < Math.floor(testimonial.rating) ? "currentColor" : "none"}
                      strokeWidth={i < Math.floor(testimonial.rating) ? 0 : 2}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{testimonial.rating.toFixed(1)}</span>
              </div>
              
              <p className="text-gray-700 mb-6">"{testimonial.comment}"</p>
              
              <div className="flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h4 className="font-medium">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}
                    {testimonial.company && `, ${testimonial.company}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
