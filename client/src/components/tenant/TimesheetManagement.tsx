import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Plus, Menu, Edit2, Trash2, ChevronDown, Clock } from "lucide-react";

const timesheetSchema = z.object({
  projectId: z.number().min(1, "Project is required"),
  date: z.string().min(1, "Date is required"),
  hours: z.number().min(0.1, "Hours must be greater than 0").max(24, "Hours cannot exceed 24"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

type TimesheetData = z.infer<typeof timesheetSchema>;

interface TimesheetManagementProps {
  subdomain: string;
  userRole: string;
}

export function TimesheetManagement({ subdomain, userRole }: TimesheetManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const form = useForm<TimesheetData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      projectId: 0,
      date: new Date().toISOString().split('T')[0],
      hours: 8,
      description: "",
      status: "pending",
    },
  });

  // Fetch timesheets
  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/timesheets`],
  });

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/projects`],
  });

  // Create timesheet mutation
  const createTimesheetMutation = useMutation({
    mutationFn: async (data: TimesheetData) => {
      const response = await apiRequest('POST', `/api/tenant/${subdomain}/timesheets`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/timesheets`] });
      toast({ title: "Success", description: "Timesheet entry created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create timesheet entry", variant: "destructive" });
    },
  });

  // Update timesheet mutation
  const updateTimesheetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TimesheetData }) => {
      const response = await apiRequest('PUT', `/api/tenant/${subdomain}/timesheets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/timesheets`] });
      toast({ title: "Success", description: "Timesheet entry updated successfully" });
      setEditingTimesheet(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update timesheet entry", variant: "destructive" });
    },
  });

  // Delete timesheet mutation
  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tenant/${subdomain}/timesheets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${subdomain}/timesheets`] });
      toast({ title: "Success", description: "Timesheet entry deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete timesheet entry", variant: "destructive" });
    },
  });

  const onSubmit = (data: TimesheetData) => {
    if (editingTimesheet) {
      updateTimesheetMutation.mutate({ id: editingTimesheet.id, data });
    } else {
      createTimesheetMutation.mutate(data);
    }
  };

  const handleEdit = (timesheet: any) => {
    setEditingTimesheet(timesheet);
    form.reset({
      projectId: timesheet.projectId,
      date: new Date(timesheet.date).toISOString().split('T')[0],
      hours: parseFloat(timesheet.hours),
      description: timesheet.description,
      status: timesheet.status,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this timesheet entry?")) {
      deleteTimesheetMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setEditingTimesheet(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  // Calculate total hours
  const totalHours = timesheets.reduce((sum: number, timesheet: any) => sum + parseFloat(timesheet.hours || 0), 0);

  return (
    <main className="ml-[114px] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-6 h-6 mr-2" />
                  Timesheet
                </h1>
                <p className="text-sm text-gray-600">Track your work hours and manage timesheets</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{totalHours.toFixed(1)} Total Hours</span>
                </div>
              </div>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTimesheet ? 'Edit Timesheet Entry' : 'Add New Timesheet Entry'}</DialogTitle>
                <DialogDescription>
                  {editingTimesheet ? 'Update timesheet entry details' : 'Log your work hours for a project'}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map((project: any) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours Worked</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            min="0.1"
                            max="24"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe what you worked on..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {userRole === 'admin' || userRole === 'manager' ? (
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
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingTimesheet(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={createTimesheetMutation.isPending || updateTimesheetMutation.isPending}
                    >
                      {editingTimesheet ? 'Update Entry' : 'Save Entry'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly Timesheet Grid */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Timesheet</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">Time Off</Button>
                <Button variant="outline" className="bg-orange-500 text-white hover:bg-orange-600">Save</Button>
                <Button variant="outline">Reset</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Weekly timesheet grid view will be implemented here</p>
              <p className="text-sm">Current implementation focuses on individual entry management</p>
            </div>
          </CardContent>
        </Card>

        {/* Timesheet Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Timesheet Entries ({timesheets.length})
            </CardTitle>
            <CardDescription>All timesheet entries with current status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse">Loading timesheet entries...</div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {timesheets.map((timesheet: any) => (
                      <tr key={timesheet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(timesheet.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {timesheet.project?.name || 'No Project'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={timesheet.description}>
                            {timesheet.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {parseFloat(timesheet.hours).toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            timesheet.status === 'approved' ? 'bg-green-100 text-green-800' :
                            timesheet.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {timesheet.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Menu className="w-4 h-4 mr-1" />
                                Actions
                                <ChevronDown className="w-4 h-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(timesheet)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(timesheet.id)}
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}