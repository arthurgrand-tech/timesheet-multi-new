import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { EmployeeManagement } from "@/components/tenant/EmployeeManagement";
import { useTenantAuth } from "@/hooks/useAuth";

export default function TenantUsers() {
  const params = useParams();
  const [, navigate] = useLocation();
  const subdomain = params.subdomain;
  const { isAuthenticated, isLoading, user } = useTenantAuth(subdomain);

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

  // Only allow admin users to access user management
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
        
        <main className="ml-[114px] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You need admin privileges to access user management.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      <EmployeeManagement subdomain={subdomain} userRole={user?.role || 'user'} />
    </div>
  );
}