import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantAuth } from "@/hooks/useAuth";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Settings, Bell, LogOut, Users } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const createResourceSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(["user", "manager", "admin"]).default("user"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  tenantId: z.number(),
});

type CreateResourceForm = z.infer<typeof createResourceSchema>;

interface Resource {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function Resources() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { user, isAuthenticated, isLoading } = useTenantAuth(subdomain);
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState("resources");
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<CreateResourceForm>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      employeeId: "",
      department: "",
      designation: "",
      role: "user",
      password: "",
      tenantId: user?.tenantId || 0,
    },
  });

  // Get users/resources
  const { data: resources = [], isLoading: isLoadingResources } = useQuery<Resource[]>({
    queryKey: [`/api/tenant/${subdomain}/users`],
    enabled: !!subdomain && !!user,
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: CreateResourceForm) => {
      return await apiRequest('POST', `/api/tenant/${subdomain}/users`, {
        ...data,
        tenantId: user?.tenantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/users`] });
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Resource> }) => {
      return await apiRequest('PUT', `/api/tenant/${subdomain}/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/users`] });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingResource(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/tenant/${subdomain}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/users`] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateResourceForm) => {
    createResourceMutation.mutate(data);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      deleteResourceMutation.mutate(id);
    }
  };

  const filteredResources = resources.filter((resource: Resource) =>
    resource.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const handleSettingsClick = () => {
    window.location.href = `/tenant/${subdomain}/settings`;
  };

  const handleLogout = () => {
    window.location.href = `/api/tenant/${subdomain}/logout`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      <TenantHeader
        icon={<div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>}
        title="Resources"
        description="Manage employees, resources, timesheets, and more"
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />

      <main className="ml-[114px] bg-gray-50 pt-20">
        <div className="p-6">
          {/* Create Resource Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    Create Resource
                  </DialogTitle>
                  <p className="text-sm text-gray-600">Add a new employee to your team</p>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="employee" defaultChecked />
                        <label htmlFor="employee" className="text-sm">Employee</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="contractor" />
                        <label htmlFor="contractor" className="text-sm">Contractor</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="subcontractor" />
                        <label htmlFor="subcontractor" className="text-sm">Subcontractor</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="changeManager" />
                        <label htmlFor="changeManager" className="text-sm">Change Manager</label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Last Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Password" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-sm text-gray-600 mb-4">
                      <p>Additional Info *</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox id="sendActivation" defaultChecked />
                        <label htmlFor="sendActivation" className="text-sm">Send Activation</label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createResourceMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createResourceMutation.isPending ? 'Creating...' : 'Add'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Resource Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <Edit className="w-4 h-4 text-white" />
                    </div>
                    Edit Resource
                  </DialogTitle>
                  <p className="text-sm text-gray-600">Update employee information</p>
                </DialogHeader>
                
                {editingResource && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <Input 
                          defaultValue={editingResource.firstName}
                          onChange={(e) => setEditingResource({...editingResource, firstName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <Input 
                          defaultValue={editingResource.lastName}
                          onChange={(e) => setEditingResource({...editingResource, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input 
                          defaultValue={editingResource.email}
                          onChange={(e) => setEditingResource({...editingResource, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Employee ID</label>
                        <Input 
                          defaultValue={editingResource.employeeId || ''}
                          onChange={(e) => setEditingResource({...editingResource, employeeId: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Department</label>
                        <Input 
                          defaultValue={editingResource.department || ''}
                          onChange={(e) => setEditingResource({...editingResource, department: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Designation</label>
                        <Input 
                          defaultValue={editingResource.designation || ''}
                          onChange={(e) => setEditingResource({...editingResource, designation: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => updateResourceMutation.mutate({
                          id: editingResource.id,
                          data: editingResource
                        })}
                        disabled={updateResourceMutation.isPending}
                      >
                        {updateResourceMutation.isPending ? "Updating..." : "Update Resource"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

          {/* Edit Resource Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  Edit Resource
                </DialogTitle>
                <p className="text-sm text-gray-600">Update employee information</p>
              </DialogHeader>
              
              {editingResource && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input 
                        defaultValue={editingResource.firstName}
                        onChange={(e) => setEditingResource({...editingResource, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <Input 
                        defaultValue={editingResource.lastName}
                        onChange={(e) => setEditingResource({...editingResource, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        defaultValue={editingResource.email}
                        onChange={(e) => setEditingResource({...editingResource, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Employee ID</label>
                      <Input 
                        defaultValue={editingResource.employeeId || ''}
                        onChange={(e) => setEditingResource({...editingResource, employeeId: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Department</label>
                      <Input 
                        defaultValue={editingResource.department || ''}
                        onChange={(e) => setEditingResource({...editingResource, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Designation</label>
                      <Input 
                        defaultValue={editingResource.designation || ''}
                        onChange={(e) => setEditingResource({...editingResource, designation: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => updateResourceMutation.mutate({
                        id: editingResource.id,
                        data: editingResource
                      })}
                      disabled={updateResourceMutation.isPending}
                    >
                      {updateResourceMutation.isPending ? "Updating..." : "Update Resource"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-auto grid-cols-4 bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
              <TabsTrigger 
                value="resources" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Resources
              </TabsTrigger>
              <TabsTrigger 
                value="department" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Department
              </TabsTrigger>
              <TabsTrigger 
                value="resourceGroup" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Resource Group
              </TabsTrigger>
              <TabsTrigger 
                value="vendor" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Vendor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="mt-6">
              {/* Search and Filter */}
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Resources Table */}
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                      <TableHead className="text-white font-medium">Resource Id</TableHead>
                      <TableHead className="text-white font-medium">Resource Name</TableHead>
                      <TableHead className="text-white font-medium">Email Id</TableHead>
                      <TableHead className="text-white font-medium">Status</TableHead>
                      <TableHead className="text-white font-medium">Contact Number</TableHead>
                      <TableHead className="text-white font-medium">Gender</TableHead>
                      <TableHead className="text-white font-medium">Department</TableHead>
                      <TableHead className="text-white font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingResources ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="animate-pulse">Loading...</div>
                        </TableCell>
                      </TableRow>
                    ) : filteredResources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No Entries Found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResources.map((resource: Resource) => (
                        <TableRow key={resource.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {resource.employeeId || `EMP${resource.id.toString().padStart(3, '0')}`}
                          </TableCell>
                          <TableCell>{resource.firstName} {resource.lastName}</TableCell>
                          <TableCell>{resource.email}</TableCell>
                          <TableCell>
                            <Badge variant={resource.isActive ? "default" : "secondary"}>
                              {resource.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>+1234567890</TableCell>
                          <TableCell>Male</TableCell>
                          <TableCell>{resource.department || "Not Assigned"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(resource)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(resource.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Timeline Note */}
              <div className="mt-6 text-sm text-gray-600">
                To View Timeline and modifications history
              </div>
            </TabsContent>

            <TabsContent value="department" className="mt-6">
              <div className="text-center py-12 text-gray-500">
                Department management coming soon
              </div>
            </TabsContent>

            <TabsContent value="resourceGroup" className="mt-6">
              <div className="text-center py-12 text-gray-500">
                Resource Group management coming soon
              </div>
            </TabsContent>

            <TabsContent value="vendor" className="mt-6">
              <div className="text-center py-12 text-gray-500">
                Vendor management coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}