import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePlatformAuth } from "@/hooks/useAuth";
import { Building, Users, DollarSign, BarChart3 } from "lucide-react";

export default function PlatformDashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, user } = usePlatformAuth();

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/platform/dashboard'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/platform/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    {
      title: "Total Tenants",
      value: dashboardData?.totalTenants || 0,
      icon: Building,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Users",
      value: dashboardData?.totalUsers || 0,
      icon: Users,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${dashboardData?.monthlyRevenue || 0}`,
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Growth Rate",
      value: `${dashboardData?.growthRate || 0}%`,
      icon: BarChart3,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="platform" userRole={user?.role} />
      
      <main className="ml-[114px] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName || user?.email}. Here's your platform overview.
            </p>
          </div>

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
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Latest organizations that joined the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentTenants?.map((tenant: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-gray-500">{tenant.subdomain}.app</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent tenants</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Platform performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Response Time</span>
                    <span className="text-sm text-gray-600">120ms avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-gray-600">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Connections</span>
                    <span className="text-sm text-gray-600">{dashboardData?.activeConnections || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}