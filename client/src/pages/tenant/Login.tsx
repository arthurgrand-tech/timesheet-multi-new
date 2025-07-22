import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { LoginForm } from "@/components/auth/LoginForm";
import { useTenantAuth } from "@/hooks/useAuth";

export default function TenantLogin() {
  const params = useParams();
  const [, navigate] = useLocation();
  const subdomain = params.subdomain;
  const { isAuthenticated, isLoading } = useTenantAuth(subdomain);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(`/tenant/${subdomain}/dashboard`);
    }
  }, [isAuthenticated, isLoading, navigate, subdomain]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#787dbd] to-[#f17f85] flex items-center justify-center p-4">
      <LoginForm 
        type="tenant" 
        subdomain={subdomain}
        onSuccess={() => navigate(`/tenant/${subdomain}/dashboard`)} 
      />
    </div>
  );
}