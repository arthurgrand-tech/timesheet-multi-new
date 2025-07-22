import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Building, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  type: 'platform' | 'tenant';
  subdomain?: string;
  onSuccess?: () => void;
}

export function LoginForm({ type, subdomain, onSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const endpoint = type === 'platform' 
        ? '/api/platform/auth/login'
        : `/api/tenant/${subdomain}/auth/login`;
      
      const response = await apiRequest('POST', endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      // Store token in localStorage for client-side access if needed
      if (data.token) {
        localStorage.setItem(`${type}Token`, data.token);
      }
      
      onSuccess?.();
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
      toast({
        title: "Error",
        description: error.message || 'Login failed',
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-[#787dbd] to-[#f17f85] rounded-full flex items-center justify-center">
          {type === 'platform' ? (
            <Building className="w-6 h-6 text-white" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">
          {type === 'platform' ? 'Platform Admin' : `${subdomain} Login`}
        </CardTitle>
        <CardDescription>
          {type === 'platform' 
            ? 'Sign in to manage tenants and platform settings'
            : `Sign in to your ${subdomain} workspace`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#787dbd] to-[#f17f85] hover:from-[#6a6fb0] to-[#ef727a]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}