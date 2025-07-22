import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantAuth } from "@/hooks/useAuth";
import { Clock, ChevronLeft, ChevronRight, Plus, Trash2, Save, Send, Settings, Bell, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TimesheetRow {
  id: string;
  projectId: number;
  projectName: string;
  taskId: number;
  taskName: string;
  employeeId: number;
  hoursPerDay: number[]; // 7 days array
  total: number;
}

export default function TimesheetWeekly() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { user, isAuthenticated, isLoading } = useTenantAuth(subdomain);
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timesheetRows, setTimesheetRows] = useState<TimesheetRow[]>([]);

  // Get current week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedWeek);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get assigned projects only
  const { data: projects = [] } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/projects/assigned`],
    enabled: !!subdomain && !!user,
  });

  // Get tasks
  const { data: tasks = [] } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/tasks`],
    enabled: !!subdomain && !!user,
  });

  // Initialize with default empty row
  useEffect(() => {
    if (user && timesheetRows.length === 0) {
      setTimesheetRows([
        {
          id: '1',
          projectId: 0,
          projectName: '',
          taskId: 0,
          taskName: '',
          employeeId: user?.id || 1,
          hoursPerDay: [0, 0, 0, 0, 0, 0, 0],
          total: 0
        }
      ]);
    }
  }, [user, timesheetRows.length]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  const updateHours = (rowId: string, dayIndex: number, hours: number) => {
    setTimesheetRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const newHoursPerDay = [...row.hoursPerDay];
        newHoursPerDay[dayIndex] = hours;
        const total = newHoursPerDay.reduce((sum, h) => sum + h, 0);
        return { ...row, hoursPerDay: newHoursPerDay, total };
      }
      return row;
    }));
  };

  const addRow = () => {
    const newRow: TimesheetRow = {
      id: Date.now().toString(),
      projectId: 0,
      projectName: '',
      taskId: 0,
      taskName: '',
      employeeId: user?.id || 1,
      hoursPerDay: [0, 0, 0, 0, 0, 0, 0],
      total: 0
    };
    setTimesheetRows(prev => [...prev, newRow]);
  };

  const deleteRow = (rowId: string) => {
    setTimesheetRows(prev => prev.filter(row => row.id !== rowId));
  };

  const updateRowProject = (rowId: string, projectId: number, projectName: string) => {
    setTimesheetRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, projectId, projectName };
      }
      return row;
    }));
  };

  const updateRowTask = (rowId: string, taskId: number, taskName: string) => {
    setTimesheetRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, taskId, taskName };
      }
      return row;
    }));
  };

  // Calculate totals
  const dailyTotals = weekdays.map((_, dayIndex) => 
    timesheetRows.reduce((sum, row) => sum + (row.hoursPerDay[dayIndex] || 0), 0)
  );
  const grandTotal = dailyTotals.reduce((sum, total) => sum + total, 0);

  const saveTimesheet = useMutation({
    mutationFn: async () => {
      const timesheetData = {
        weekStart: weekDates[0].toISOString(),
        weekEnd: weekDates[6].toISOString(),
        entries: timesheetRows
      };
      return await apiRequest(`/api/tenant/${subdomain}/timesheets/weekly`, 'POST', timesheetData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Timesheet saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save timesheet",
        variant: "destructive",
      });
    },
  });

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
          <Clock className="w-4 h-4 text-white" />
        </div>}
        title="Timesheet"
        description="View and manage timesheet entries. Use filters to find timesheets by date range."
        onCreateClick={() => {}}
        createLabel="Create"
      />

      <main className="ml-[114px] bg-gray-50 pt-20">
        <div className="p-6">

          {/* Employee Info Header */}
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 min-w-[120px]">Employee Name</span>
                  <span className="font-medium text-blue-600">Oliver John</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 min-w-[120px]">Employee ID</span>
                  <span className="font-medium">#HCL 098PG</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 min-w-[120px]">Status</span>
                  <Badge className="bg-green-100 text-green-800">New</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 min-w-[120px]">Current Day & Time</span>
                  <span className="font-medium">11/11/2024 8:36PM</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 min-w-[120px]">Timesheet Cycle</span>
                  <span className="font-medium">Weekly</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Select Period</span>
                <select className="border rounded px-3 py-1 text-sm">
                  <option>This Week, 02/01/2025 - 02/07/2025</option>
                </select>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{grandTotal.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Reported Hrs</div>
              </div>
            </div>
          </div>

          {/* Timesheet Grid */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                  <TableHead className="text-white font-medium w-32">Project</TableHead>
                  <TableHead className="text-white font-medium w-32">Task</TableHead>
                  <TableHead className="text-white font-medium w-24">Pay Type</TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Mon</span>
                      <span className="text-xs opacity-90">FEB 01</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Tue</span>
                      <span className="text-xs opacity-90">FEB 02</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Wed</span>
                      <span className="text-xs opacity-90">FEB 03</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Thu</span>
                      <span className="text-xs opacity-90">FEB 04</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Fri</span>
                      <span className="text-xs opacity-90">FEB 05</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Sat</span>
                      <span className="text-xs opacity-90">FEB 06</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">
                    <div className="flex flex-col items-center">
                      <span>Sun</span>
                      <span className="text-xs opacity-90">FEB 07</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-medium text-center w-20">Total Hours</TableHead>
                  <TableHead className="text-white font-medium w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheetRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Select
                        value={row.projectId > 0 ? row.projectId.toString() : ""}
                        onValueChange={(value) => {
                          const project = projects.find((p: any) => p.id.toString() === value);
                          if (project) {
                            updateRowProject(row.id, project.id, project.name);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-8 text-left">
                          <SelectValue placeholder="Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.taskId > 0 ? row.taskId.toString() : ""}
                        onValueChange={(value) => {
                          updateRowTask(row.id, parseInt(value), value);
                        }}
                      >
                        <SelectTrigger className="w-full h-8 text-left">
                          <SelectValue placeholder="Task" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Task</SelectItem>
                          <SelectItem value="2">Development</SelectItem>
                          <SelectItem value="3">Testing</SelectItem>
                          <SelectItem value="4">Design</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue="regular">
                        <SelectTrigger className="w-full h-8 text-left">
                          <SelectValue placeholder="Regular" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="overtime">Overtime</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {weekdays.map((_, dayIndex) => (
                      <TableCell key={dayIndex} className="text-center p-2">
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          value={row.hoursPerDay[dayIndex] || ''}
                          onChange={(e) => updateHours(row.id, dayIndex, parseFloat(e.target.value) || 0)}
                          className="w-14 h-8 text-center border-gray-300"
                          placeholder=""
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-medium">
                      {row.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {timesheetRows.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteRow(row.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}


              </TableBody>
            </Table>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-gray-100 p-4 mt-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={addRow}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Add Row
                </Button>
                <Button variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Time Off
                </Button>
                <span className="text-sm text-gray-600 ml-4">Cumulative Hours</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  Reset
                </Button>
                <Button 
                  className="bg-gray-600 hover:bg-gray-700"
                  onClick={() => saveTimesheet.mutate()}
                  disabled={saveTimesheet.isPending}
                >
                  Save
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}