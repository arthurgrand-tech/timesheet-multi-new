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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantAuth } from "@/hooks/useAuth";
import { Plus, Search, Edit, Trash2, Settings, Bell, LogOut, Users } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  customerId: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  tenantId: z.number(),
  createdById: z.number(),
});

type CreateClientForm = z.infer<typeof createClientSchema>;

interface Client {
  id: number;
  customerId: string;
  name: string;
  email: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
}

export default function Clients() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { user, isAuthenticated, isLoading } = useTenantAuth(subdomain);
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<CreateClientForm>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      email: "",
      customerId: "",
      status: "active",
      address: "",
      city: "",
      state: "",
      pincode: "",
      tenantId: user?.tenantId || 0,
      createdById: user?.id || 0,
    },
  });

  // Get clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/tenant', subdomain, 'customers'],
    enabled: !!subdomain && !!user,
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: CreateClientForm) => {
      return await apiRequest('POST', `/api/tenant/${subdomain}/customers`, {
        ...data,
        tenantId: user?.tenantId,
        createdById: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant', subdomain, 'customers'] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Client> }) => {
      return await apiRequest('PUT', `/api/tenant/${subdomain}/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant', subdomain, 'customers'] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/tenant/${subdomain}/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant', subdomain, 'customers'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClientForm) => {
    createClientMutation.mutate(data);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClientMutation.mutate(id);
    }
  };

  const filteredClients = clients.filter((client: Client) =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.customerId?.toLowerCase().includes(searchTerm.toLowerCase())
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
        icon={<div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>}
        title="Clients"
        description="Manage your client information"
        onCreateClick={() => setIsCreateDialogOpen(true)}
        createLabel="Create Client"
      />

      <main className="ml-[114px] bg-gray-50 pt-20">
        <div className="p-6">
          {/* Create Client Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    Create Client
                  </DialogTitle>
                  <p className="text-sm text-gray-600">Add a new client to your system</p>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Client Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input placeholder="Pincode" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createClientMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <Edit className="w-4 h-4 text-white" />
                    </div>
                    Edit Client
                  </DialogTitle>
                  <p className="text-sm text-gray-600">Update client information</p>
                </DialogHeader>
                
                {editingClient && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Client Name</label>
                        <Input 
                          defaultValue={editingClient.name}
                          onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input 
                          defaultValue={editingClient.email}
                          onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <Input 
                          defaultValue={editingClient.address || ''}
                          onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">City</label>
                        <Input 
                          defaultValue={editingClient.city || ''}
                          onChange={(e) => setEditingClient({...editingClient, city: e.target.value})}
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
                        onClick={() => updateClientMutation.mutate({
                          id: editingClient.id,
                          data: editingClient
                        })}
                        disabled={updateClientMutation.isPending}
                      >
                        {updateClientMutation.isPending ? "Updating..." : "Update Client"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                  <TableHead className="text-white font-medium">Client ID</TableHead>
                  <TableHead className="text-white font-medium">Client Name</TableHead>
                  <TableHead className="text-white font-medium">Email</TableHead>
                  <TableHead className="text-white font-medium">Status</TableHead>
                  <TableHead className="text-white font-medium">City</TableHead>
                  <TableHead className="text-white font-medium">State</TableHead>
                  <TableHead className="text-white font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingClients ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No Clients Found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client: Client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {client.customerId}
                      </TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? "default" : "secondary"}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.city || "-"}</TableCell>
                      <TableCell>{client.state || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(client.id)}
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
        </div>
      </main>
    </div>
  );
}