import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusIcon,
  MenuIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const customerSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "inactive"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

type CustomerData = z.infer<typeof customerSchema>;

interface Customer {
  id: number;
  customerId: string;
  name: string;
  email: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt: string;
}

interface CustomerManagementProps {
  subdomain: string;
  userRole: string;
}

export function CustomerManagement({ subdomain, userRole }: CustomerManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const form = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerId: "",
      name: "",
      email: "",
      status: "active",
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // Fetch customers
  const { data: customers, isLoading } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/customers`],
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerData) => {
      const response = await apiRequest('POST', `/api/tenant/${subdomain}/customers`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/customers`] });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to create customer',
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CustomerData> }) => {
      const response = await apiRequest('PUT', `/api/tenant/${subdomain}/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/customers`] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setEditingCustomer(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to update customer',
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tenant/${subdomain}/customers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/customers`] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to delete customer',
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      customerId: customer.customerId,
      name: customer.name,
      email: customer.email,
      status: customer.status as "active" | "inactive",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (customerId: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleCreateNew = () => {
    setEditingCustomer(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="ml-[116px] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <main className="ml-[114px] p-6">
        {/* Success Alert */}
        {showSuccessAlert && (
          <Alert className="absolute top-5 right-5 w-[332px] h-[90px] bg-[#2d6b59] rounded-[25px] border-none z-50">
            <div className="absolute w-[42px] h-[42px] top-[22px] left-7 bg-[#4e8d7c] rounded-[21px] flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <AlertDescription className="ml-16 mt-5 text-white text-lg">
              Success, Customer entry created successfully
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center">
            <div className="w-[30px] h-[18px] mr-2 bg-gradient-to-r from-[#787dbd] to-[#f17f85] rounded"></div>
            <h1 className="font-medium text-3xl">Customers</h1>
          </div>
          
          {/* Create Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleCreateNew}
                className="w-[126px] h-[59px] bg-[#696fb3] rounded-[10px] hover:bg-[#5a5fa3]"
              >
                <PlusIcon className="w-3.5 h-3.5 mr-2" />
                <span className="font-medium text-lg">Create</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer ? 'Update customer information' : 'Add a new customer to your workspace'}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer ID</FormLabel>
                          <FormControl>
                            <Input placeholder="HC092458942" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Oliver John" {...field} />
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
                          <Input type="email" placeholder="oliver@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Stony Meadows" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="America" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="America" {...field} />
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
                            <Input placeholder="10001" {...field} />
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
                        setEditingCustomer(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-[#787dbd] to-[#f17f85] hover:from-[#6a6fb0] to-[#ef727a]"
                      disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                    >
                      {editingCustomer ? 'Update Customer' : 'Create Customer'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        {/* Customer Table */}
        <Card className="border-none shadow-none">
          <div className="w-full rounded-t-[10px] bg-gradient-to-r from-[#787dbd] to-[#f17f85] p-6">
            <div className="flex justify-between items-center">
              <div className="text-white font-semibold text-lg">Customer List</div>
              <div className="text-white text-sm">
                {customers?.length || 0} customers
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
              <TableRow>
                <TableHead className="text-white font-medium text-lg">Customer ID</TableHead>
                <TableHead className="text-white font-medium text-lg">Customer Name</TableHead>
                <TableHead className="text-white font-medium text-lg">Email ID</TableHead>
                <TableHead className="text-white font-medium text-lg">Status</TableHead>
                <TableHead className="text-white font-medium text-lg">Address</TableHead>
                <TableHead className="text-white font-medium text-lg">City</TableHead>
                <TableHead className="text-white font-medium text-lg">State</TableHead>
                <TableHead className="text-white font-medium text-lg">Pincode</TableHead>
                <TableHead className="text-white font-medium text-lg">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer: Customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-normal text-lg">{customer.customerId}</TableCell>
                  <TableCell className="font-normal text-lg">{customer.name}</TableCell>
                  <TableCell className="font-normal text-lg">
                    <a href={`mailto:${customer.email}`} className="underline text-blue-600">
                      {customer.email}
                    </a>
                  </TableCell>
                  <TableCell className={`font-normal text-lg ${
                    customer.status === 'active' ? 'text-[#1e8c5a]' : 'text-red-600'
                  }`}>
                    {customer.status}
                  </TableCell>
                  <TableCell className="font-normal text-lg">{customer.address || '-'}</TableCell>
                  <TableCell className="font-normal text-lg">{customer.city || '-'}</TableCell>
                  <TableCell className="font-normal text-lg">{customer.state || '-'}</TableCell>
                  <TableCell className="font-normal text-lg">{customer.pincode || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-[45px] w-[137px] rounded-[10px]"
                        >
                          <MenuIcon className="w-3.5 h-4 mr-2" />
                          Actions
                          <ChevronDownIcon className="w-[9px] h-[5px] ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                          <EditIcon className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600"
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!customers?.length && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No customers found</p>
              <Button 
                onClick={handleCreateNew}
                className="mt-4 bg-gradient-to-r from-[#787dbd] to-[#f17f85] hover:from-[#6a6fb0] to-[#ef727a]"
              >
                Create Your First Customer
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}