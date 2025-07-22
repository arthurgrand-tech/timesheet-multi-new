import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bell, 
  User, 
  LogOut, 
  UserCircle, 
  Palette,
  Shield,
  HelpCircle
} from "lucide-react";

interface HeaderProps {
  title?: string;
  user?: any;
  subdomain?: string;
}

export function Header({ title = "Timesheet", user, subdomain }: HeaderProps) {
  const [, navigate] = useLocation();
  const [notifications] = useState([
    { id: 1, title: "New timesheet submitted", time: "2 min ago", unread: true },
    { id: 2, title: "Weekly report ready", time: "1 hour ago", unread: true },
    { id: 3, title: "System maintenance scheduled", time: "2 hours ago", unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    window.location.href = `/api/tenant/${subdomain}/logout`;
  };

  const handleSettingsClick = () => {
    navigate(`/tenant/${subdomain}/settings`);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 relative z-50">
      {/* Left side - Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-sm font-medium">📋</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {title === "Timesheet" && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        {/* Settings */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 h-9 p-0"
          onClick={handleSettingsClick}
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h4 className="font-medium">Notifications</h4>
              <p className="text-sm text-gray-500">You have {unreadCount} unread notifications</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="p-3 flex-col items-start">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <p className={`text-sm ${notification.unread ? 'font-medium' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-3 justify-center text-blue-600">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/api/placeholder/32/32" alt={user?.email || "User"} />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-3 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/api/placeholder/40/40" alt={user?.email || "User"} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user?.email || "User"}</p>
                  <p className="text-xs text-gray-500">{subdomain} tenant</p>
                </div>
              </div>
            </div>
            <DropdownMenuItem>
              <UserCircle className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}