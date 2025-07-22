import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { TimesheetManagement } from "@/components/tenant/TimesheetManagement";
import { useTenantAuth } from "@/hooks/useAuth";

export default function TenantTimesheet() {
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

  return (
    <div className="min-h-screen bg-white">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      <TimesheetManagement subdomain={subdomain} userRole={user?.role || 'user'} />
    </div>
  );
}