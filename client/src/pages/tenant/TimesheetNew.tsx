import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantAuth } from "@/hooks/useAuth";
import { Plus, Calendar, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO } from "date-fns";

const createTimesheetSchema = z.object({
  projectId: z.number().min(1, "Project is required"),
  taskId: z.number().optional(),
  customerId: z.number().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  mondayHours: z.number().min(0).max(24).default(0),
  tuesdayHours: z.number().min(0).max(24).default(0),
  wednesdayHours: z.number().min(0).max(24).default(0),
  thursdayHours: z.number().min(0).max(24).default(0),
  fridayHours: z.number().min(0).max(24).default(0),
  saturdayHours: z.number().min(0).max(24).default(0),
  sundayHours: z.number().min(0).max(24).default(0),
  payType: z.enum(["regular", "overtime", "double_time"]).default("regular"),
  notes: z.string().optional(),
});

type CreateTimesheetForm = z.infer<typeof createTimesheetSchema>;

export default function TimesheetNew() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { user, isAuthenticated, isLoading } = useTenantAuth(subdomain);
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const form = useForm<CreateTimesheetForm>({
    resolver: zodResolver(createTimesheetSchema),
    defaultValues: {
      projectId: 0,
      taskId: 0,
      customerId: 0,
      date: format(weekStart, 'yyyy-MM-dd'),
      mondayHours: 0,
      tuesdayHours: 0,
      wednesdayHours: 0,
      thursdayHours: 0,
      fridayHours: 0,
      saturdayHours: 0,
      sundayHours: 0,
      payType: "regular",
      notes: "",
    },
  });

  // Get timesheets for current week
  const { data: timesheets = [], isLoading: isLoadingTimesheets } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'timesheets', format(weekStart, 'yyyy-MM-dd')],
    enabled: !!subdomain && !!user,
  });

  // Get projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'projects'],
    enabled: !!subdomain && !!user,
  });

  // Get customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'customers'],
    enabled: !!subdomain && !!user,
  });

  // Get tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'tasks'],
    enabled: !!subdomain && !!user,
  });

  // Create timesheet mutation
  const createTimesheetMutation = useMutation({
    mutationFn: async (data: CreateTimesheetForm) => {
      const totalHours = data.mondayHours + data.tuesdayHours + data.wednesdayHours + 
                        data.thursdayHours + data.fridayHours + data.saturdayHours + data.sundayHours;
      
      return await apiRequest(`/api/tenant/${subdomain}/timesheets`, 'POST', {
        ...data,
        userId: user?.id,
        tenantId: user?.tenantId,
        totalHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant', subdomain, 'timesheets'] });
      toast({
        title: "Success",
        description: "Timesheet entry created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timesheet entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTimesheetForm) => {
    createTimesheetMutation.mutate(data);
  };

  const previousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      <main className="ml-[114px] bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Timesheet</h1>
                <p className="text-sm text-gray-600">Track your weekly work hours</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add Timesheet Entry</DialogTitle>
                  <p className="text-sm text-gray-600">Create a new timesheet entry for the week</p>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.name}
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
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
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
                        name="payType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pay Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pay type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="overtime">Overtime</SelectItem>
                                <SelectItem value="double_time">Double Time</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Week Hours Input */}
                    <div className="grid grid-cols-7 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                        const fieldName = `${day.toLowerCase()}Hours` as keyof CreateTimesheetForm;
                        return (
                          <FormField
                            key={day}
                            control={form.control}
                            name={fieldName}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{day.slice(0, 3)}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="24"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="text-center"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completing Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add notes about this timesheet entry..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="outline">
                        Save Off
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTimesheetMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createTimesheetMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Previous Home</label>
                <Input type="date" defaultValue="11/11/2024" className="w-40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">When</label>
                <Input defaultValue="Regular" className="w-32" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Employee ID</label>
                <Input defaultValue="001" className="w-32" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Color Due & Use</label>
                <Input defaultValue="11/11/2024 8:50 PM" className="w-48" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Deadline Cycle</label>
                <Input defaultValue="Weekly" className="w-32" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status Period</label>
                <Input defaultValue="In Process" className="w-32" />
              </div>
            </div>
            <div className="text-2xl font-bold">40:00</div>
          </div>

          {/* Week Navigation Controls */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={previousWeek} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Week
            </Button>
            <h2 className="text-lg font-semibold">
              Week of {format(weekStart, 'MMM dd, yyyy')}
            </h2>
            <Button variant="outline" onClick={nextWeek} size="sm">
              Next Week
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Timesheet Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                  <TableHead className="text-white font-medium">Project</TableHead>
                  <TableHead className="text-white font-medium">Task</TableHead>
                  <TableHead className="text-white font-medium">Pay Type</TableHead>
                  <TableHead className="text-white font-medium w-16">Mon<br/>{format(weekDays[0], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium w-16">Tue<br/>{format(weekDays[1], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium w-16">Wed<br/>{format(weekDays[2], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium w-16">Thu<br/>{format(weekDays[3], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium w-16">Fri<br/>{format(weekDays[4], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium w-16">Sat<br/>{format(weekDays[5], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium w-16">Sun<br/>{format(weekDays[6], 'dd')}</TableHead>
                  <TableHead className="text-white font-medium">Total</TableHead>
                  <TableHead className="text-white font-medium">Unit Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTimesheets ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                      No timesheet entries for this week. Click "Add Entry" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((timesheet: any) => (
                    <TableRow key={timesheet.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {projects.find((p: any) => p.id === timesheet.projectId)?.name || 'Unknown Project'}
                      </TableCell>
                      <TableCell>
                        {tasks.find((t: any) => t.id === timesheet.taskId)?.name || 'General'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{timesheet.payType}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{timesheet.mondayHours || '0'}</TableCell>
                      <TableCell className="text-center">{timesheet.tuesdayHours || '0'}</TableCell>
                      <TableCell className="text-center">{timesheet.wednesdayHours || '0'}</TableCell>
                      <TableCell className="text-center">{timesheet.thursdayHours || '0'}</TableCell>
                      <TableCell className="text-center">{timesheet.fridayHours || '0'}</TableCell>
                      <TableCell className="text-center">{timesheet.saturdayHours || '0'}</TableCell>
                      <TableCell className="text-center">{timesheet.sundayHours || '0'}</TableCell>
                      <TableCell className="font-medium">{timesheet.totalHours || '0'}</TableCell>
                      <TableCell>
                        <Badge variant={timesheet.status === 'approved' ? 'default' : 'secondary'}>
                          {timesheet.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                
                {/* Summary Row */}
                <TableRow className="bg-blue-50 font-medium">
                  <TableCell colSpan={3}>Total Hours</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="font-bold">0.00</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                
                {/* Overtime Row */}
                <TableRow className="bg-yellow-50">
                  <TableCell colSpan={3}>Overtime</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="text-center">0.00</TableCell>
                  <TableCell className="font-bold">0.00</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              <Button variant="outline" className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500">
                Save Off
              </Button>
              <Button variant="outline" className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500">
                Time Off
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                Save
              </Button>
              <Button variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}