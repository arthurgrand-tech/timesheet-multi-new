import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/Sidebar";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { useTenantAuth } from "@/hooks/useAuth";
import { Users, FolderOpen, Clock, DollarSign, Settings, Bell, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TenantDashboard() {
  const params = useParams();
  const [, navigate] = useLocation();
  const subdomain = params.subdomain;
  const { isAuthenticated, isLoading, user, tenant } = useTenantAuth(subdomain);

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/dashboard`],
    enabled: isAuthenticated && !!subdomain,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/tenant/${subdomain}/login`);
    }
  }, [isAuthenticated, isLoading, navigate, subdomain]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !subdomain) {
    return null;
  }

  const stats = [
    {
      title: "Total Customers",
      value: dashboardData?.totalCustomers || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Projects",
      value: dashboardData?.activeProjects || 0,
      icon: FolderOpen,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Hours This Month",
      value: dashboardData?.monthlyHours || 0,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Monthly Expenses",
      value: `$${dashboardData?.monthlyExpenses || 0}`,
      icon: DollarSign,
      color: "from-orange-500 to-orange-600",
    },
  ];

  const handleSettingsClick = () => {
    navigate(`/tenant/${subdomain}/settings`);
  };

  const handleLogout = () => {
    window.location.href = `/api/tenant/${subdomain}/logout`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      <TenantHeader
        icon={<div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>}
        title="Dashboard"
        description={`Welcome to ${tenant?.name || 'your organization'} dashboard`}
        onCreateClick={() => {}}
        createLabel="Quick Action"
      />

      <main className="ml-[114px] bg-gray-50 pt-20">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
          {/* Stats and Content */}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Customers</CardTitle>
                <CardDescription>Latest customers added to your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentCustomers?.map((customer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent customers</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Time Entries</CardTitle>
                <CardDescription>Latest timesheet entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentTimesheets?.map((timesheet: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{timesheet.description || 'Work logged'}</p>
                        <p className="text-sm text-gray-500">
                          {timesheet.project?.name || 'General'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{timesheet.hours}h</p>
                        <p className="text-sm text-gray-500">
                          {new Date(timesheet.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent time entries</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => navigate(`/tenant/${subdomain}/customers`)}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="font-medium">Add Customer</p>
                  <p className="text-sm text-gray-500">Create a new customer entry</p>
                </button>
                
                <button 
                  onClick={() => navigate(`/tenant/${subdomain}/projects`)}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen className="w-8 h-8 text-green-500 mb-2" />
                  <p className="font-medium">New Project</p>
                  <p className="text-sm text-gray-500">Start a new project</p>
                </button>
                
                <button 
                  onClick={() => navigate(`/tenant/${subdomain}/timesheet`)}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-8 h-8 text-purple-500 mb-2" />
                  <p className="font-medium">Log Time</p>
                  <p className="text-sm text-gray-500">Record work hours</p>
                </button>
                
                <button 
                  onClick={() => navigate(`/tenant/${subdomain}/expenses`)}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <DollarSign className="w-8 h-8 text-orange-500 mb-2" />
                  <p className="font-medium">Add Expense</p>
                  <p className="text-sm text-gray-500">Submit an expense</p>
                </button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </main>
    </div>
  );
}