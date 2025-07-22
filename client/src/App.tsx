import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Platform Pages
import PlatformLogin from "@/pages/platform/Login";
import PlatformDashboard from "@/pages/platform/Dashboard";
import PlatformTenants from "@/pages/platform/Tenants";

// Tenant Pages
import TenantLogin from "@/pages/tenant/Login";
import TenantDashboard from "@/pages/tenant/Dashboard";
import TenantCustomers from "@/pages/tenant/Customers";
import TenantProjects from "@/pages/tenant/Projects";
import TenantTimesheet from "@/pages/tenant/Timesheet";
import TenantTimesheetNew from "@/pages/tenant/TimesheetNew";
import TenantExpenses from "@/pages/tenant/Expenses";
import TenantUsers from "@/pages/tenant/Users";
import TenantResources from "@/pages/tenant/Resources";
import TenantProjectsNew from "@/pages/tenant/ProjectsNew";
import TenantSettings from "@/pages/tenant/Settings";
import TenantTimesheetWeekly from "@/pages/tenant/TimesheetWeekly";
import TimesheetList from "@/pages/tenant/TimesheetList";

// Landing Page
import Landing from "@/pages/Landing";
import LandingPage from "@/pages/LandingPage";
import TenantLoginPage from "@/pages/TenantLoginPage";

function Router() {
  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/" component={Landing} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/tenant-login" component={TenantLoginPage} />
      
      {/* Platform Routes */}
      <Route path="/platform/login" component={PlatformLogin} />
      <Route path="/platform/dashboard" component={PlatformDashboard} />
      <Route path="/platform/tenants" component={PlatformTenants} />
      
      {/* Tenant Routes */}
      <Route path="/tenant/:subdomain/login" component={TenantLogin} />
      <Route path="/tenant/:subdomain/dashboard" component={TenantDashboard} />
      <Route path="/tenant/:subdomain/customers" component={TenantCustomers} />
      <Route path="/tenant/:subdomain/projects" component={TenantProjects} />
      <Route path="/tenant/:subdomain/projects-new" component={TenantProjectsNew} />
      <Route path="/tenant/:subdomain/timesheet" component={TimesheetList} />
      <Route path="/tenant/:subdomain/timesheet-new" component={TenantTimesheetWeekly} />
      <Route path="/tenant/:subdomain/resources" component={TenantResources} />
      <Route path="/tenant/:subdomain/expenses" component={TenantExpenses} />
      <Route path="/tenant/:subdomain/users" component={TenantUsers} />
      <Route path="/tenant/:subdomain/settings" component={TenantSettings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
