import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePlatformAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, Plus, Menu, Edit2, Trash2, ChevronDown } from "lucide-react";

// Zod schema for tenant validation
const tenantSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain must contain only lowercase letters, numbers, and hyphens"),
  subscriptionPlan: z.enum(["basic", "premium", "enterprise"]),
  maxUsers: z.number().min(1, "Max users must be at least 1"),
});

type TenantData = z.infer<typeof tenantSchema>;

export default function PlatformTenants() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, user } = usePlatformAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  const form = useForm<TenantData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      subscriptionPlan: "basic",
      maxUsers: 10,
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/platform/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch tenants
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['/api/platform/tenants'],
    enabled: isAuthenticated,
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantData) => {
      const response = await apiRequest('POST', '/api/platform/tenants', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform/tenants'] });
      toast({
        title: "Success",
        description: "Tenant created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tenant",
        variant: "destructive",
      });
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TenantData }) => {
      const response = await apiRequest('PUT', `/api/platform/tenants/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform/tenants'] });
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });
      setEditingTenant(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tenant",
        variant: "destructive",
      });
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/platform/tenants/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform/tenants'] });
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tenant",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TenantData) => {
    if (editingTenant) {
      updateTenantMutation.mutate({ id: editingTenant.id, data });
    } else {
      createTenantMutation.mutate(data);
    }
  };

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    form.reset({
      name: tenant.name,
      subdomain: tenant.subdomain,
      subscriptionPlan: tenant.subscriptionPlan,
      maxUsers: tenant.maxUsers,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      deleteTenantMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setEditingTenant(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="platform" userRole={user?.role} />
      
      <main className="ml-[114px] bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Tenant Management</h1>
              <p className="text-sm text-gray-600">Manage organizations and their subscriptions</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-4 py-2 h-9"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tenant
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTenant ? 'Update tenant information' : 'Add a new organization to the platform'}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomain</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Input placeholder="acme" {...field} />
                              <span className="ml-2 text-gray-500">.your-app.com</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subscriptionPlan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subscription Plan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic - $29/month</SelectItem>
                                <SelectItem value="premium">Premium - $79/month</SelectItem>
                                <SelectItem value="enterprise">Enterprise - $199/month</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maxUsers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Users</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setEditingTenant(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={createTenantMutation.isPending || updateTenantMutation.isPending}
                      >
                        {editingTenant ? 'Update Tenant' : 'Create Tenant'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tenants Table */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-600" />
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Tenants ({tenants.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  All organizations registered on the platform
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tenantsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">Loading tenants...</div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">Organization</th>
                        <th className="px-6 py-3 text-left">Subdomain</th>
                        <th className="px-6 py-3 text-left">Plan</th>
                        <th className="px-6 py-3 text-left">Max Users</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Created</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {tenants.map((tenant: any) => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {tenant.subdomain}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              tenant.subscriptionPlan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                              tenant.subscriptionPlan === 'premium' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {tenant.subscriptionPlan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tenant.maxUsers}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-[32px] w-[137px] rounded-lg border-gray-300 text-xs">
                                  <Menu className="w-3 h-3 mr-2" />
                                  Actions
                                  <ChevronDown className="w-3 h-3 ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(tenant.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!tenantsLoading && !tenants.length && (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No tenants found</p>
                  <Button 
                    onClick={handleCreateNew}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Your First Tenant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}