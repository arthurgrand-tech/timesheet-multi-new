import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import { 
  platformStorage, 
  createTenantStorage,
  type IPlatformStorage,
  type ITenantStorage 
} from "./storage";
import {
  authenticatePlatformUser,
  authenticateTenantUser,
  requireSuperAdmin,
  requirePlatformAdmin,
  requireTenantAdmin,
  requireTenantManager,
  requireTenantUser,
  hashPassword,
  comparePasswords,
  generateToken,
  type AuthenticatedPlatformRequest,
  type AuthenticatedTenantRequest
} from "./auth";
import {
  insertPlatformUserSchema,
  insertTenantSchema,
  insertUserSchema,
  insertCustomerSchema,
  insertProjectSchema,
  insertTimesheetSchema,
  insertTaskSchema,
  insertExpenseSchema,
  type PlatformUser,
  type Tenant,
  type User
} from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // ==================== PLATFORM AUTHENTICATION ROUTES ====================
  
  // Platform login (Super Admin / Product Owner)
  app.post('/api/platform/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const user = await platformStorage.getPlatformUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      const token = generateToken({ userId: user.id, role: user.role, type: 'platform' });
      
      // Set secure cookie
      res.cookie('platformToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Platform login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Platform user registration (Super Admin only)
  app.post('/api/platform/auth/register', authenticatePlatformUser, requireSuperAdmin, async (req: AuthenticatedPlatformRequest, res) => {
    try {
      const validatedData = insertPlatformUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await platformStorage.getPlatformUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      const user = await platformStorage.createPlatformUser({
        ...validatedData,
        password: hashedPassword
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Platform registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get current platform user
  app.get('/api/platform/auth/me', authenticatePlatformUser, (req: AuthenticatedPlatformRequest, res) => {
    const user = req.user!;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  });

  // Platform logout
  app.post('/api/platform/auth/logout', (req, res) => {
    res.clearCookie('platformToken');
    res.json({ message: 'Logged out successfully' });
  });

  // Platform Dashboard Stats
  app.get('/api/platform/dashboard', authenticatePlatformUser, async (req: AuthenticatedPlatformRequest, res) => {
    try {
      const tenants = await platformStorage.getAllTenants();
      
      // Calculate stats
      const totalTenants = tenants.length;
      const activeTenants = tenants.filter(t => t.status === 'active').length;
      
      // Calculate total users across all tenants
      let totalUsers = 0;
      for (const tenant of tenants) {
        try {
          const tenantStorage = createTenantStorage(tenant.dbConnectionString || process.env.DATABASE_URL!);
          const users = await tenantStorage.getUsersByTenant(tenant.id);
          totalUsers += users.length;
        } catch (error) {
          console.error(`Error getting users for tenant ${tenant.id}:`, error);
        }
      }

      // Calculate revenue based on subscription plans
      const monthlyRevenue = tenants.reduce((total, tenant) => {
        const planRevenue = {
          'basic': 29,
          'premium': 99,
          'enterprise': 299
        };
        return total + (planRevenue[tenant.subscriptionPlan as keyof typeof planRevenue] || 0);
      }, 0);

      // Calculate growth rate (simplified - based on active vs total tenants)
      const growthRate = totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0;

      res.json({
        totalTenants,
        totalUsers,
        monthlyRevenue,
        growthRate,
        activeTenants,
        recentTenants: tenants.slice(-5).reverse() // Last 5 tenants
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== TENANT AUTHENTICATION ROUTES ====================

  // Tenant user login
  app.post('/api/tenant/:subdomain/auth/login', async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Get tenant
      const tenant = await platformStorage.getTenantBySubdomain(subdomain);
      if (!tenant || tenant.status !== 'active') {
        return res.status(404).json({ message: 'Tenant not found or inactive' });
      }

      // Get tenant storage and user
      const tenantStorage = createTenantStorage(tenant.dbConnectionString || process.env.DATABASE_URL!);
      const user = await tenantStorage.getUserByEmail(email);
      
      if (!user || user.tenantId !== tenant.id) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      const token = generateToken({ 
        userId: user.id, 
        tenantId: tenant.id, 
        role: user.role, 
        type: 'tenant' 
      });
      
      // Set secure cookie
      res.cookie('tenantToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain
        },
        token
      });
    } catch (error) {
      console.error('Tenant login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get current tenant user
  app.get('/api/tenant/:subdomain/auth/me', authenticateTenantUser, (req: AuthenticatedTenantRequest, res) => {
    const user = req.user!;
    const tenant = req.tenant!;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId
      },
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain
      }
    });
  });

  // Tenant logout
  app.post('/api/tenant/:subdomain/auth/logout', (req, res) => {
    res.clearCookie('tenantToken');
    res.json({ message: 'Logged out successfully' });
  });

  // ==================== PLATFORM TENANT MANAGEMENT ROUTES ====================

  // Get all tenants (Platform Admin only)
  app.get('/api/platform/tenants', authenticatePlatformUser, requirePlatformAdmin, async (req: AuthenticatedPlatformRequest, res) => {
    try {
      const tenants = await platformStorage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Get tenants error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create tenant (Platform Admin only)
  app.post('/api/platform/tenants', authenticatePlatformUser, requirePlatformAdmin, async (req: AuthenticatedPlatformRequest, res) => {
    try {
      const validatedData = insertTenantSchema.parse(req.body);
      
      // Check if subdomain already exists
      const existingTenant = await platformStorage.getTenantBySubdomain(validatedData.subdomain);
      if (existingTenant) {
        return res.status(400).json({ message: 'Subdomain already exists' });
      }

      const tenant = await platformStorage.createTenant({
        ...validatedData,
        dbConnectionString: validatedData.dbConnectionString || process.env.DATABASE_URL!
      });

      res.status(201).json(tenant);
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update tenant (Platform Admin only)
  app.put('/api/platform/tenants/:id', authenticatePlatformUser, requirePlatformAdmin, async (req: AuthenticatedPlatformRequest, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const updateData = req.body;

      const tenant = await platformStorage.updateTenant(tenantId, updateData);
      res.json(tenant);
    } catch (error) {
      console.error('Update tenant error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete tenant (Super Admin only)
  app.delete('/api/platform/tenants/:id', authenticatePlatformUser, requireSuperAdmin, async (req: AuthenticatedPlatformRequest, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      await platformStorage.deleteTenant(tenantId);
      res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
      console.error('Delete tenant error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== TENANT USER MANAGEMENT ROUTES ====================

  // Create tenant user (Tenant Admin only)
  app.post('/api/tenant/:subdomain/users', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const { email, password, firstName, lastName, employeeId, department, designation, role } = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      // Check if user already exists
      const existingUser = await tenantStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      
      const user = await tenantStorage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        employeeId: employeeId || undefined,
        department: department || undefined,
        designation: designation || undefined,
        role: role || 'user',
        isActive: true,
        tenantId: req.tenant!.id
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        role: user.role,
        isActive: user.isActive,
        tenantId: user.tenantId
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get tenant users (Tenant Manager only)
  app.get('/api/tenant/:subdomain/users', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const users = await tenantStorage.getUsersByTenant(req.tenant!.id);
      
      // Remove passwords from response
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update user/resource
  app.put('/api/tenant/:subdomain/users/:id', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const user = await tenantStorage.updateUser(userId, updateData);
      
      // Remove password from response
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete user/resource
  app.delete('/api/tenant/:subdomain/users/:id', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      
      await tenantStorage.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== CUSTOMER MANAGEMENT ROUTES ====================

  // Get customers
  app.get('/api/tenant/:subdomain/customers', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const customers = await tenantStorage.getCustomersByTenant(req.tenant!.id);
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create customer
  app.post('/api/tenant/:subdomain/customers', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const customer = await tenantStorage.createCustomer({
        ...validatedData,
        tenantId: req.tenant!.id,
        createdById: req.user!.id
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update customer  
  app.put('/api/tenant/:subdomain/customers/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const updateData = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const customer = await tenantStorage.updateCustomer(customerId, updateData);
      res.json(customer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete customer
  app.delete('/api/tenant/:subdomain/customers/:id', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      
      await tenantStorage.deleteCustomer(customerId);
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== PROJECT MANAGEMENT ROUTES ====================

  // Get projects
  app.get('/api/tenant/:subdomain/projects', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const projects = await tenantStorage.getProjectsByTenant(req.tenant!.id);
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create project
  app.post('/api/tenant/:subdomain/projects', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      // Convert string dates to Date objects if provided
      const requestData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        tenantId: req.tenant!.id,
        createdById: req.user!.id
      };

      const validatedData = insertProjectSchema.parse(requestData);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const project = await tenantStorage.createProject(validatedData);

      res.status(201).json(project);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update project
  app.put('/api/tenant/:subdomain/projects/:id', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updateData = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const project = await tenantStorage.updateProject(projectId, updateData);
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete project
  app.delete('/api/tenant/:subdomain/projects/:id', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      
      await tenantStorage.deleteProject(projectId);
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== TIMESHEET ROUTES ====================

  // Get user's timesheets
  app.get('/api/tenant/:subdomain/timesheets', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const timesheets = await tenantStorage.getTimesheetsByUser(req.user!.id);
      res.json(timesheets);
    } catch (error) {
      console.error('Get timesheets error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create timesheet
  app.post('/api/tenant/:subdomain/timesheets', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const validatedData = insertTimesheetSchema.parse(req.body);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const timesheet = await tenantStorage.createTimesheet({
        ...validatedData,
        userId: req.user!.id,
        tenantId: req.tenant!.id
      });

      res.status(201).json(timesheet);
    } catch (error) {
      console.error('Create timesheet error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update timesheet
  app.put('/api/tenant/:subdomain/timesheets/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const timesheetId = parseInt(req.params.id);
      const updateData = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const timesheet = await tenantStorage.updateTimesheet(timesheetId, updateData);
      res.json(timesheet);
    } catch (error) {
      console.error('Update timesheet error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete timesheet
  app.delete('/api/tenant/:subdomain/timesheets/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const timesheetId = parseInt(req.params.id);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      
      await tenantStorage.deleteTimesheet(timesheetId);
      res.json({ message: 'Timesheet deleted successfully' });
    } catch (error) {
      console.error('Delete timesheet error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== TASK ROUTES ====================

  // Get tasks
  app.get('/api/tenant/:subdomain/tasks', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const { projectId } = req.query;
      
      let tasks;
      if (projectId) {
        tasks = await tenantStorage.getTasksByProject(parseInt(projectId as string));
      } else {
        tasks = await tenantStorage.getTasksByTenant(req.tenant!.id);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create task
  app.post('/api/tenant/:subdomain/tasks', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const task = await tenantStorage.createTask({
        ...validatedData,
        tenantId: req.tenant!.id,
        createdById: req.user!.id
      });

      res.status(201).json(task);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update task
  app.put('/api/tenant/:subdomain/tasks/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updateData = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const task = await tenantStorage.updateTask(taskId, updateData);
      res.json(task);
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete task
  app.delete('/api/tenant/:subdomain/tasks/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      
      await tenantStorage.deleteTask(taskId);
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== PROJECT ASSIGNMENT ROUTES ====================

  // Get user's assigned projects
  app.get('/api/tenant/:subdomain/projects/assigned', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const assignedProjects = await tenantStorage.getAssignedProjects(req.user!.id);
      res.json(assignedProjects);
    } catch (error) {
      console.error('Get assigned projects error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Assign user to project
  app.post('/api/tenant/:subdomain/projects/:projectId/assign', authenticateTenantUser, requireTenantManager, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { userId, role } = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      await tenantStorage.assignUserToProject(projectId, userId, role || 'member');
      res.json({ message: 'User assigned to project successfully' });
    } catch (error) {
      console.error('Assign user to project error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== EXPENSE ROUTES ====================

  // Get user's expenses
  app.get('/api/tenant/:subdomain/expenses', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      const expenses = await tenantStorage.getExpensesByUser(req.user!.id);
      res.json(expenses);
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create expense
  app.post('/api/tenant/:subdomain/expenses', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const expense = await tenantStorage.createExpense({
        ...validatedData,
        userId: req.user!.id,
        tenantId: req.tenant!.id
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update expense
  app.put('/api/tenant/:subdomain/expenses/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const updateData = req.body;
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);

      const expense = await tenantStorage.updateExpense(expenseId, updateData);
      res.json(expense);
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete expense
  app.delete('/api/tenant/:subdomain/expenses/:id', authenticateTenantUser, requireTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const tenantStorage = createTenantStorage(req.tenant!.connectionString);
      
      await tenantStorage.deleteExpense(expenseId);
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== SUBSCRIPTION ROUTES ====================
  
  // Get subscription data
  app.get('/api/tenant/:subdomain/subscription', authenticateTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const { subdomain } = req.params;
      const tenant = await platformStorage.getTenantBySubdomain(subdomain);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      const subscriptionData = {
        plan: (tenant as any).subscriptionPlan,
        status: (tenant as any).subscriptionStatus,
        stripeCustomerId: (tenant as any).stripeCustomerId,
        stripeSubscriptionId: (tenant as any).stripeSubscriptionId,
        nextBilling: (tenant as any).subscriptionEndsAt
      };

      res.json(subscriptionData);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription data" });
    }
  });

  // Upgrade subscription
  app.post('/api/tenant/:subdomain/subscription/upgrade', authenticateTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const { subdomain } = req.params;
      const { plan } = req.body;
      
      const tenant = await platformStorage.getTenantBySubdomain(subdomain);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // If downgrading to free, no Stripe needed
      if (plan === 'free') {
        // Cancel existing subscription if any
        if ((tenant as any).stripeSubscriptionId) {
          await stripe.subscriptions.cancel((tenant as any).stripeSubscriptionId);
        }
        
        // Update tenant to free plan
        await platformStorage.updateTenantSubscription(tenant.id, {
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          stripeSubscriptionId: null,
          subscriptionEndsAt: null
        });

        return res.json({ success: true, message: 'Downgraded to free plan' });
      }

      // For paid plans, create Stripe customer if not exists
      let customerId = (tenant as any).stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user?.email || '',
          name: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`,
          metadata: {
            tenantId: tenant.id.toString(),
            subdomain: subdomain
          }
        });
        customerId = customer.id;
      }

      // Create subscription
      const priceAmount = plan === 'enterprise' ? 500 : 1500; // $5 for enterprise, $15 for standard (in cents)
      
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            },
            unit_amount: priceAmount,
            recurring: {
              interval: 'month',
            },
          } as any,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update tenant with Stripe info
      await platformStorage.updateTenantSubscription(tenant.id, {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      const paymentIntent = (subscription.latest_invoice as any)?.payment_intent as Stripe.PaymentIntent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status
      });

    } catch (error: any) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: error.message || "Failed to upgrade subscription" });
    }
  });

  // Cancel subscription
  app.post('/api/tenant/:subdomain/subscription/cancel', authenticateTenantUser, async (req: AuthenticatedTenantRequest, res) => {
    try {
      const { subdomain } = req.params;
      
      const tenant = await platformStorage.getTenantBySubdomain(subdomain);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Cancel Stripe subscription
      if ((tenant as any).stripeSubscriptionId) {
        await stripe.subscriptions.cancel((tenant as any).stripeSubscriptionId);
      }

      // Update tenant to free plan
      await platformStorage.updateTenantSubscription(tenant.id, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        subscriptionEndsAt: null
      });

      res.json({ success: true, message: 'Subscription cancelled successfully' });

    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: error.message || "Failed to cancel subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
