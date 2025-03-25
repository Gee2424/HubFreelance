import { JobCategory } from "@/types";
import { Link } from "wouter";

interface JobCategoryCardProps {
  category: JobCategory;
}

export default function JobCategoryCard({ category }: JobCategoryCardProps) {
  // Map icon names to classes for font-awesome (in real app would use Lucide)
  const getIconClass = () => {
    switch (category.icon) {
      case "laptop-code":
        return "fas fa-laptop-code";
      case "paint-brush":
        return "fas fa-paint-brush";
      case "pen":
        return "fas fa-pen";
      case "chart-line":
        return "fas fa-chart-line";
      case "mobile-alt":
        return "fas fa-mobile-alt";
      case "server":
        return "fas fa-server";
      default:
        return "fas fa-briefcase";
    }
  };
  
  // Map category names to background colors
  const getBgColor = () => {
    switch (category.name) {
      case "Web Development":
        return "bg-blue-100 text-primary";
      case "Design & Creative":
        return "bg-indigo-100 text-accent";
      case "Writing & Translation":
        return "bg-green-100 text-secondary";
      case "Marketing & SEO":
        return "bg-yellow-100 text-yellow-600";
      case "Mobile Development":
        return "bg-red-100 text-red-600";
      case "IT & Networking":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 rounded-full ${getBgColor()} flex items-center justify-center mr-4`}>
          <i className={`${getIconClass()} text-xl`}></i>
        </div>
        <h3 className="text-xl font-semibold">{category.name}</h3>
      </div>
      <p className="text-gray-600 mb-4">{category.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{category.count} jobs</span>
        <Link href={`/jobs?category=${encodeURIComponent(category.name)}`} className="text-primary font-medium hover:underline">
          Browse Jobs
        </Link>
      </div>
    </div>
  );
}
