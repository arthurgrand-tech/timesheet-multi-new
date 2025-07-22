import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantAuth } from "@/hooks/useAuth";
import { Plus, Search, MapPin, Calendar, Users } from "lucide-react";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customerId: z.number().min(1, "Customer is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["active", "inactive", "completed"]).default("active"),
});

const createTaskSchema = z.object({
  projectId: z.number().min(1, "Project is required"),
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;
type CreateTaskForm = z.infer<typeof createTaskSchema>;

export default function ProjectsNew() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { user, isAuthenticated, isLoading } = useTenantAuth(subdomain);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);

  const projectForm = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      customerId: 0,
      description: "",
      startDate: "",
      endDate: "",
      status: "active",
    },
  });

  const taskForm = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      projectId: 0,
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  });

  // Get projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'projects'],
    enabled: !!subdomain && !!user,
  });

  // Get customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'customers'],
    enabled: !!subdomain && !!user,
  });

  // Get tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/tenant', subdomain, 'tasks'],
    enabled: !!subdomain && !!user,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      return await apiRequest(`/api/tenant/${subdomain}/projects`, 'POST', {
        ...data,
        tenantId: user?.tenantId,
        createdById: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant', subdomain, 'projects'] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setIsCreateProjectDialogOpen(false);
      projectForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskForm) => {
      return await apiRequest(`/api/tenant/${subdomain}/tasks`, 'POST', {
        ...data,
        tenantId: user?.tenantId,
        createdById: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant', subdomain, 'tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setIsCreateTaskDialogOpen(false);
      taskForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onSubmitProject = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };

  const onSubmitTask = (data: CreateTaskForm) => {
    createTaskMutation.mutate(data);
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
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      <main className="ml-[114px] bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
                <p className="text-sm text-gray-600">The modern tool to manage any size</p>
              </div>
            </div>
            
            <Button 
              onClick={() => activeTab === 'projects' ? setIsCreateProjectDialogOpen(true) : setIsCreateTaskDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-auto grid-cols-2 bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
              <TabsTrigger 
                value="projects" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Project Details
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none px-4 py-3"
              >
                Task Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              {/* Projects Table */}
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                      <TableHead className="text-white font-medium">Project Id</TableHead>
                      <TableHead className="text-white font-medium">Project Name</TableHead>
                      <TableHead className="text-white font-medium">Customer Name</TableHead>
                      <TableHead className="text-white font-medium">Team Strength</TableHead>
                      <TableHead className="text-white font-medium">Assign Employees</TableHead>
                      <TableHead className="text-white font-medium">Start Date</TableHead>
                      <TableHead className="text-white font-medium">End Date</TableHead>
                      <TableHead className="text-white font-medium">Active Resources</TableHead>
                      <TableHead className="text-white font-medium">Total Days</TableHead>
                      <TableHead className="text-white font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingProjects ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="animate-pulse">Loading...</div>
                        </TableCell>
                      </TableRow>
                    ) : projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No Entries Found
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects.map((project: any) => (
                        <TableRow key={project.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">PRJ{project.id.toString().padStart(3, '0')}</TableCell>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>
                            {customers.find((c: any) => c.id === project.customerId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>5</TableCell>
                          <TableCell>
                            <Badge variant="outline">Assign</Badge>
                          </TableCell>
                          <TableCell>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>3</TableCell>
                          <TableCell>45 days</TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              {/* Tasks Table */}
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                      <TableHead className="text-white font-medium">Project Name</TableHead>
                      <TableHead className="text-white font-medium">Task ID</TableHead>
                      <TableHead className="text-white font-medium">Task Name</TableHead>
                      <TableHead className="text-white font-medium">Start Date</TableHead>
                      <TableHead className="text-white font-medium">End Date</TableHead>
                      <TableHead className="text-white font-medium">Assignee</TableHead>
                      <TableHead className="text-white font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTasks ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-pulse">Loading...</div>
                        </TableCell>
                      </TableRow>
                    ) : tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No Entries Found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task: any) => (
                        <TableRow key={task.id} className="hover:bg-gray-50">
                          <TableCell>
                            {projects.find((p: any) => p.id === task.projectId)?.name || 'Unknown Project'}
                          </TableCell>
                          <TableCell className="font-medium">TSK{task.id.toString().padStart(3, '0')}</TableCell>
                          <TableCell>{task.name}</TableCell>
                          <TableCell>{task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>{task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Assign</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                              {task.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Create Project Dialog */}
          <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  Create Project
                </DialogTitle>
                <p className="text-sm text-gray-600">Add a new project to the platform</p>
              </DialogHeader>
              
              <Form {...projectForm}>
                <form onSubmit={projectForm.handleSubmit(onSubmitProject)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Project Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name</FormLabel>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-4 pt-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="billable" defaultChecked />
                        <label htmlFor="billable" className="text-sm">Bill Type</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="trackable" defaultChecked />
                        <label htmlFor="trackable" className="text-sm">Trackable</label>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={projectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter project description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateProjectDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProjectMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createProjectMutation.isPending ? 'Creating...' : 'Add'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Create Task Dialog */}
          <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  Create Task
                </DialogTitle>
                <p className="text-sm text-gray-600">Create a task specific to the Project Network</p>
              </DialogHeader>
              
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
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
                      control={taskForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Task Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={taskForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter task description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateTaskDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTaskMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createTaskMutation.isPending ? 'Creating...' : 'Add'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}