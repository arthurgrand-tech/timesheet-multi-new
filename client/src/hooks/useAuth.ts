import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export interface PlatformUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface TenantUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: number;
}

export interface Tenant {
  id: number;
  subdomain: string;
}

export function usePlatformAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/platform/auth/me"],
    retry: false,
  });

  return {
    user: data?.user as PlatformUser | undefined,
    isLoading,
    error,
    isAuthenticated: !!data?.user,
  };
}

export function useTenantAuth(subdomain?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/auth/me`],
    retry: false,
    enabled: !!subdomain,
  });

  return {
    user: data?.user as TenantUser | undefined,
    tenant: data?.tenant as Tenant | undefined,
    isLoading,
    error,
    isAuthenticated: !!data?.user,
  };
}

// Hook to determine current context based on URL
export function useAppContext() {
  const [location] = useLocation();
  
  // Determine if we're in platform admin or tenant context
  const isPlatformAdmin = location.startsWith('/platform');
  const tenantMatch = location.match(/^\/tenant\/([^\/]+)/);
  const subdomain = tenantMatch ? tenantMatch[1] : undefined;
  
  return {
    isPlatformAdmin,
    subdomain,
    context: isPlatformAdmin ? 'platform' : subdomain ? 'tenant' : 'unknown'
  };
}