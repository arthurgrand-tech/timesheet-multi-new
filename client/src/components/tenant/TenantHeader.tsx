import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Settings, Bell, Plus } from "lucide-react";

interface TenantHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onCreateClick: () => void;
  createLabel?: string;
}

export function TenantHeader({ 
  icon, 
  title, 
  description, 
  onCreateClick, 
  createLabel = "Create" 
}: TenantHeaderProps) {
  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  return (
    <div className="fixed top-0 left-[114px] right-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        
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
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <h4 className="font-medium">Notifications</h4>
                <p className="text-sm text-gray-500">You have 2 unread notifications</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Button */}
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onCreateClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            {createLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}