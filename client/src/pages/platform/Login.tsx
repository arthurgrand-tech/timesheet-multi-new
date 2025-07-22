import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/auth/LoginForm";
import { usePlatformAuth } from "@/hooks/useAuth";

export default function PlatformLogin() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = usePlatformAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/platform/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
        type="platform" 
        onSuccess={() => navigate('/platform/dashboard')} 
      />
    </div>
  );
}