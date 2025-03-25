import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Get initials for avatar fallback
  const getInitials = () => {
      if (user?.fullName) {
        return user.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase();
      }
      if (user?.username) {
        return user.username.substring(0, 2).toUpperCase();
      }
      return 'U'; // Default fallback
    };

  return (
    <div className="flex items-center space-x-4">
      <NotificationDropdown />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <Avatar className="h-10 w-10 border-2 border-gray-200">
              <AvatarImage src={user.avatar || undefined} alt={user.fullName || user.username} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="ml-3 hidden md:block">
              <p className="text-sm font-medium text-gray-800">{user.fullName || user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer w-full">
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer w-full">
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer w-full">
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}