import { JobCategory } from "@/types";
import JobCategoryCard from "@/components/jobs/JobCategoryCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Mock categories (in a real app, this would come from the API)
const categories: JobCategory[] = [
  {
    name: "Web Development",
    icon: "laptop-code",
    description: "Frontend, backend, full-stack development, and CMS customization.",
    count: 1245
  },
  {
    name: "Design & Creative",
    icon: "paint-brush",
    description: "UI/UX design, graphic design, illustration, and animation.",
    count: 856
  },
  {
    name: "Writing & Translation",
    icon: "pen",
    description: "Content writing, copywriting, technical writing, and translation.",
    count: 734
  },
  {
    name: "Marketing & SEO",
    icon: "chart-line",
    description: "Digital marketing, social media, SEO, and PPC campaigns.",
    count: 528
  },
  {
    name: "Mobile Development",
    icon: "mobile-alt",
    description: "iOS, Android, React Native, and cross-platform app development.",
    count: 421
  },
  {
    name: "IT & Networking",
    icon: "server",
    description: "System administration, DevOps, cloud services, and security.",
    count: 352
  }
];

export default function JobCategories() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Browse Jobs by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find work in your specialized field from thousands of jobs posted daily.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <JobCategoryCard key={index} category={category} />
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Button asChild size="lg">
            <Link href="/jobs">View All Categories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
