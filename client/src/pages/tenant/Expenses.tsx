import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { useTenantAuth } from "@/hooks/useAuth";

export default function TenantExpenses() {
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      <main className="ml-[114px] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Expenses</h1>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">Expense management coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}