import { 
  platformUsers,
  tenants,
  users, 
  customers,
  projects,
  timesheets,
  tasks,
  expenses,
  projectUsers,
  type PlatformUser, 
  type InsertPlatformUser,
  type Tenant,
  type InsertTenant,
  type User, 
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Project,
  type InsertProject,
  type Timesheet,
  type InsertTimesheet,
  type Task,
  type InsertTask,
  type Expense,
  type InsertExpense,
  type ProjectUser,
  type InsertProjectUser
} from "@shared/schema";
import { platformDb, getTenantDb } from "./db";
import { eq, and } from "drizzle-orm";
import { generateEmployeeId, generateCustomerId, generateProjectId, generateTaskId } from "./utils/idGenerator";

// ==================== PLATFORM STORAGE INTERFACE ====================

export interface IPlatformStorage {
  // Platform Users
  getPlatformUser(id: number): Promise<PlatformUser | undefined>;
  getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined>;
  createPlatformUser(user: InsertPlatformUser): Promise<PlatformUser>;
  updatePlatformUser(id: number, user: Partial<InsertPlatformUser>): Promise<PlatformUser>;
  
  // Tenants
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;
  updateTenantSubscription(id: number, subscription: {
    subscriptionPlan: string;
    subscriptionStatus: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionEndsAt?: Date | null;
  }): Promise<Tenant>;
  deleteTenant(id: number): Promise<void>;
}

// ==================== TENANT STORAGE INTERFACE ====================

export interface ITenantStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomersByTenant(tenantId: number): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getAssignedProjects(userId: number): Promise<Project[]>;
  getProjectsByTenant(tenantId: number): Promise<Project[]>;
  getProjectsByCustomer(customerId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Timesheets
  getTimesheet(id: number): Promise<Timesheet | undefined>;
  getTimesheetsByUser(userId: number): Promise<Timesheet[]>;
  getTimesheetsByProject(projectId: number): Promise<Timesheet[]>;
  getTimesheetsByTenant(tenantId: number): Promise<Timesheet[]>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: number, timesheet: Partial<InsertTimesheet>): Promise<Timesheet>;
  deleteTimesheet(id: number): Promise<void>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByTenant(tenantId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Expenses
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByUser(userId: number): Promise<Expense[]>;
  getExpensesByProject(projectId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Project User Assignments  
  assignUserToProject(projectId: number, userId: number, role?: string): Promise<void>;
  removeUserFromProject(projectId: number, userId: number): Promise<void>;
  getProjectAssignments(projectId: number): Promise<any[]>;
  getUserAssignments(userId: number): Promise<any[]>;
}

// ==================== DATABASE STORAGE IMPLEMENTATIONS ====================

export class DatabasePlatformStorage implements IPlatformStorage {
  // Platform Users
  async getPlatformUser(id: number): Promise<PlatformUser | undefined> {
    try {
      const [user] = await platformDb.select().from(platformUsers).where(eq(platformUsers.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching platform user:', error);
      throw new Error('Database connection failed');
    }
  }

  async getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined> {
    try {
      const [user] = await platformDb.select().from(platformUsers).where(eq(platformUsers.email, email));
      return user;
    } catch (error) {
      console.error('Error fetching platform user by email:', error);
      throw new Error('Database connection failed');
    }
  }

  async createPlatformUser(userData: InsertPlatformUser): Promise<PlatformUser> {
    const [user] = await platformDb.insert(platformUsers).values(userData).returning();
    return user;
  }

  async updatePlatformUser(id: number, userData: Partial<InsertPlatformUser>): Promise<PlatformUser> {
    const [user] = await platformDb.update(platformUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(platformUsers.id, id))
      .returning();
    return user;
  }

  // Tenants
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await platformDb.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await platformDb.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await platformDb.select().from(tenants);
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await platformDb.insert(tenants).values(tenantData).returning();
    return tenant;
  }

  async updateTenant(id: number, tenantData: Partial<InsertTenant>): Promise<Tenant> {
    const [tenant] = await platformDb.update(tenants)
      .set({ ...tenantData, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async updateTenantSubscription(id: number, subscription: {
    subscriptionPlan: string;
    subscriptionStatus: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionEndsAt?: Date | null;
  }): Promise<Tenant> {
    const [tenant] = await platformDb.update(tenants)
      .set({ 
        ...subscription, 
        updatedAt: new Date() 
      })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async deleteTenant(id: number): Promise<void> {
    await platformDb.delete(tenants).where(eq(tenants.id, id));
  }
}

export class DatabaseTenantStorage implements ITenantStorage {
  constructor(private tenantDb: ReturnType<typeof getTenantDb>) {}

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.tenantDb.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.tenantDb.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByTenant(tenantId: number): Promise<User[]> {
    return await this.tenantDb.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Auto-generate employeeId if not provided
    const userWithId = {
      ...userData,
      employeeId: userData.employeeId || generateEmployeeId(),
    };
    const [user] = await this.tenantDb.insert(users).values(userWithId).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await this.tenantDb.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await this.tenantDb.delete(users).where(eq(users.id, id));
  }

  // Customers
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await this.tenantDb.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomersByTenant(tenantId: number): Promise<Customer[]> {
    return await this.tenantDb.select().from(customers).where(eq(customers.tenantId, tenantId));
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    // Auto-generate customerId if not provided
    const customerWithId = {
      ...customerData,
      customerId: customerData.customerId || generateCustomerId(),
    };
    const [customer] = await this.tenantDb.insert(customers).values(customerWithId).returning();
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await this.tenantDb.update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.tenantDb.delete(customers).where(eq(customers.id, id));
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await this.tenantDb.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByTenant(tenantId: number): Promise<Project[]> {
    return await this.tenantDb.select().from(projects).where(eq(projects.tenantId, tenantId));
  }

  async getProjectsByCustomer(customerId: number): Promise<Project[]> {
    return await this.tenantDb.select().from(projects).where(eq(projects.customerId, customerId));
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await this.tenantDb.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await this.tenantDb.update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await this.tenantDb.delete(projects).where(eq(projects.id, id));
  }

  async getAssignedProjects(userId: number): Promise<Project[]> {
    const assignedProjects = await this.tenantDb
      .select({ project: projects })
      .from(projectUsers)
      .leftJoin(projects, eq(projectUsers.projectId, projects.id))
      .where(eq(projectUsers.userId, userId));
    
    return assignedProjects.map(ap => ap.project).filter(Boolean) as Project[];
  }

  // Timesheets
  async getTimesheet(id: number): Promise<Timesheet | undefined> {
    const [timesheet] = await this.tenantDb.select().from(timesheets).where(eq(timesheets.id, id));
    return timesheet;
  }

  async getTimesheetsByUser(userId: number): Promise<Timesheet[]> {
    return await this.tenantDb.select().from(timesheets).where(eq(timesheets.userId, userId));
  }

  async getTimesheetsByProject(projectId: number): Promise<Timesheet[]> {
    return await this.tenantDb.select().from(timesheets).where(eq(timesheets.projectId, projectId));
  }

  async createTimesheet(timesheetData: InsertTimesheet): Promise<Timesheet> {
    const [timesheet] = await this.tenantDb.insert(timesheets).values(timesheetData).returning();
    return timesheet;
  }

  async updateTimesheet(id: number, timesheetData: Partial<InsertTimesheet>): Promise<Timesheet> {
    const [timesheet] = await this.tenantDb.update(timesheets)
      .set({ ...timesheetData, updatedAt: new Date() })
      .where(eq(timesheets.id, id))
      .returning();
    return timesheet;
  }

  async deleteTimesheet(id: number): Promise<void> {
    await this.tenantDb.delete(timesheets).where(eq(timesheets.id, id));
  }

  async getTimesheetsByTenant(tenantId: number): Promise<Timesheet[]> {
    return await this.tenantDb.select().from(timesheets).where(eq(timesheets.tenantId, tenantId));
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await this.tenantDb.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await this.tenantDb.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async getTasksByTenant(tenantId: number): Promise<Task[]> {
    return await this.tenantDb.select().from(tasks).where(eq(tasks.tenantId, tenantId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await this.tenantDb.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task> {
    const [task] = await this.tenantDb.update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await this.tenantDb.delete(tasks).where(eq(tasks.id, id));
  }

  // Expenses
  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await this.tenantDb.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async getExpensesByUser(userId: number): Promise<Expense[]> {
    return await this.tenantDb.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return await this.tenantDb.select().from(expenses).where(eq(expenses.projectId, projectId));
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [expense] = await this.tenantDb.insert(expenses).values(expenseData).returning();
    return expense;
  }

  async updateExpense(id: number, expenseData: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await this.tenantDb.update(expenses)
      .set({ ...expenseData, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    await this.tenantDb.delete(expenses).where(eq(expenses.id, id));
  }

  // Project User Assignments
  async assignUserToProject(projectId: number, userId: number, role: string = "member"): Promise<void> {
    const [project] = await this.tenantDb.select().from(projects).where(eq(projects.id, projectId));
    if (!project) throw new Error("Project not found");

    await this.tenantDb.insert(projectUsers).values({
      projectId,
      userId,
      role,
      tenantId: project.tenantId,
    }).onConflictDoUpdate({
      target: [projectUsers.projectId, projectUsers.userId],
      set: { role, assignedAt: new Date() }
    });
  }

  async removeUserFromProject(projectId: number, userId: number): Promise<void> {
    await this.tenantDb.delete(projectUsers)
      .where(and(eq(projectUsers.projectId, projectId), eq(projectUsers.userId, userId)));
  }

  async getProjectAssignments(projectId: number): Promise<any[]> {
    const assignments = await this.tenantDb
      .select({
        id: projectUsers.id,
        userId: projectUsers.userId,
        role: projectUsers.role,
        assignedAt: projectUsers.assignedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          employeeId: users.employeeId
        }
      })
      .from(projectUsers)
      .leftJoin(users, eq(projectUsers.userId, users.id))
      .where(eq(projectUsers.projectId, projectId));
    
    return assignments;
  }

  async getUserAssignments(userId: number): Promise<any[]> {
    const assignments = await this.tenantDb
      .select({
        id: projectUsers.id,
        projectId: projectUsers.projectId,
        role: projectUsers.role,
        assignedAt: projectUsers.assignedAt,
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status
        }
      })
      .from(projectUsers)
      .leftJoin(projects, eq(projectUsers.projectId, projects.id))
      .where(eq(projectUsers.userId, userId));
    
    return assignments;
  }
}

// ==================== STORAGE INSTANCES ====================

export const platformStorage = new DatabasePlatformStorage();

// Factory function to create tenant storage
export function createTenantStorage(connectionString: string): ITenantStorage {
  const tenantDb = getTenantDb(connectionString);
  return new DatabaseTenantStorage(tenantDb);
}

// For backward compatibility
export const storage = platformStorage;
