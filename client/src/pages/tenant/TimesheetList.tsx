import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTenantAuth } from "@/hooks/useAuth";
import { Clock, Plus, Search, Filter, MoreHorizontal, Settings, Bell, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TimesheetList() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { user, isAuthenticated, isLoading } = useTenantAuth(subdomain);
  const [activeTab, setActiveTab] = useState("all");

  // Get timesheets
  const { data: timesheets = [] } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'timesheets'],
    enabled: !!subdomain && !!user,
  });

  const filteredTimesheets = timesheets.filter((timesheet: any) => {
    switch (activeTab) {
      case 'my':
        return timesheet.userId === user?.id;
      case 'approved':
        return timesheet.status === 'approved';
      case 'pending':
        return timesheet.status === 'pending';
      default:
        return true;
    }
  });

  // Sample approved timesheets for demo
  const sampleTimesheets = [
    {
      id: 1,
      employeeName: "John",
      employeeId: "HCA0001/01",
      startDate: "03/01/2024",
      endDate: "03/29/2024",
      w: 16,
      h: 0,
      totalHours: "16 Hours",
      status: "approved"
    },
    {
      id: 2,
      employeeName: "John", 
      employeeId: "HCA0001/01",
      startDate: "04/01/2024",
      endDate: "04/29/2024",
      w: 16,
      h: 0,
      totalHours: "16 Hours",
      status: "approved"
    },
    {
      id: 3,
      employeeName: "John",
      employeeId: "HCA0001/01",
      startDate: "05/01/2024",
      endDate: "05/29/2024",
      w: 16,
      h: 0,
      totalHours: "16 Hours",
      status: "approved"
    }
  ];

  const displayTimesheets = activeTab === 'approved' ? sampleTimesheets : [];

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const handleSettingsClick = () => {
    window.location.href = `/tenant/${subdomain}/settings`;
  };

  const handleLogout = () => {
    window.location.href = `/api/tenant/${subdomain}/logout`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      {/* Top Right Icons */}
      <div className="fixed top-4 right-6 flex items-center gap-3 z-50">
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
              <p className="font-medium text-sm">{user?.email || "User"}</p>
              <p className="text-xs text-gray-500">{subdomain} tenant</p>
            </div>
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
      
      <main className="ml-[114px] bg-gray-50">
        <div className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Timesheet</h1>
                <p className="text-sm text-gray-600">View and manage timesheet entries. Use filters to find timesheets by date range.</p>
              </div>
            </div>
            
            <Link href={`/tenant/${subdomain}/timesheet-new`}>
              <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-auto grid-cols-4 bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
              <TabsTrigger 
                value="all" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                All Timesheet
              </TabsTrigger>
              <TabsTrigger 
                value="my" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                My Timesheet
              </TabsTrigger>
              <TabsTrigger 
                value="approved" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Approved
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                All Timesheet
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {/* Search and Filter Bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search timesheets..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Timesheet Table */}
              <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                      <TableHead className="text-white font-medium w-12">
                        <Checkbox className="border-white data-[state=checked]:bg-white data-[state=checked]:text-purple-600" />
                      </TableHead>
                      <TableHead className="text-white font-medium">Employee Name</TableHead>
                      <TableHead className="text-white font-medium">Employee ID</TableHead>
                      <TableHead className="text-white font-medium">Start Date</TableHead>
                      <TableHead className="text-white font-medium">End Date</TableHead>
                      <TableHead className="text-white font-medium">W</TableHead>
                      <TableHead className="text-white font-medium">H</TableHead>
                      <TableHead className="text-white font-medium">Total Hours</TableHead>
                      <TableHead className="text-white font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTimesheets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-lg font-medium text-gray-500">No Timers Found</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayTimesheets.map((timesheet: any) => (
                        <TableRow key={timesheet.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium">{timesheet.employeeName}</TableCell>
                          <TableCell>{timesheet.employeeId}</TableCell>
                          <TableCell>{timesheet.startDate}</TableCell>
                          <TableCell>{timesheet.endDate}</TableCell>
                          <TableCell>{timesheet.w}</TableCell>
                          <TableCell>{timesheet.h}</TableCell>
                          <TableCell>{timesheet.totalHours}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {displayTimesheets.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page 1 of 1 • 1-3 of 3
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Prev
                    </Button>
                    <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                    <span className="text-sm text-gray-600 ml-2">Go</span>
                    <Input className="w-12 h-8" />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}