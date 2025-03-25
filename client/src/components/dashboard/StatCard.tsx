import { Card, CardContent } from "@/components/ui/card";
import { StatCard as StatCardType } from "@/types";

interface StatCardProps {
  stat: StatCardType;
}

export default function StatCard({ stat }: StatCardProps) {
  const getIconClass = () => {
    switch (stat.icon) {
      case "briefcase":
        return "fas fa-briefcase";
      case "dollar-sign":
        return "fas fa-dollar-sign";
      case "file-alt":
        return "fas fa-file-alt";
      case "star":
        return "fas fa-star";
      default:
        return "fas fa-chart-line";
    }
  };
  
  const getIconBgColor = () => {
    switch (stat.color) {
      case "blue":
        return "bg-blue-100 text-primary";
      case "green":
        return "bg-green-100 text-secondary";
      case "indigo":
        return "bg-indigo-100 text-accent";
      case "yellow":
        return "bg-yellow-100 text-yellow-500";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${getIconBgColor()}`}>
            <i className={`${getIconClass()} text-xl`}></i>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
