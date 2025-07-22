import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid, jsonb, numeric, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ==================== PLATFORM LEVEL TABLES ====================

// Platform Users (Super Admins and Product Owners)
export const platformUsers = pgTable("platform_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("product_owner"), // super_admin, product_owner
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tenants (Organizations/Companies)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  dbConnectionString: text("db_connection_string"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, suspended
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).notNull().default("free"), // free, standard, enterprise
  subscriptionStatus: varchar("subscription_status", { length: 20 }).notNull().default("active"), // active, inactive, trial
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  maxUsers: integer("max_users").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== TENANT LEVEL TABLES ====================

// Tenant Users (Employees)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  employeeId: varchar("employee_id", { length: 50 }).unique(),
  department: varchar("department", { length: 100 }),
  designation: varchar("designation", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("user"), // user, manager, admin
  isActive: boolean("is_active").notNull().default(true),
  tenantId: integer("tenant_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers (from your Figma design)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 20 }),
  tenantId: integer("tenant_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tasks/Project Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, on_hold
  tenantId: integer("tenant_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Timesheets
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),
  customerId: integer("customer_id").notNull(),
  date: timestamp("date").notNull(),
  mondayHours: numeric("monday_hours", { precision: 4, scale: 2 }).default("0"),
  tuesdayHours: numeric("tuesday_hours", { precision: 4, scale: 2 }).default("0"),
  wednesdayHours: numeric("wednesday_hours", { precision: 4, scale: 2 }).default("0"),
  thursdayHours: numeric("thursday_hours", { precision: 4, scale: 2 }).default("0"),
  fridayHours: numeric("friday_hours", { precision: 4, scale: 2 }).default("0"),
  saturdayHours: numeric("saturday_hours", { precision: 4, scale: 2 }).default("0"),
  sundayHours: numeric("sunday_hours", { precision: 4, scale: 2 }).default("0"),
  totalHours: numeric("total_hours", { precision: 4, scale: 2 }).default("0"),
  payType: varchar("pay_type", { length: 20 }).notNull().default("regular"), // regular, overtime, double_time
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, submitted, approved, rejected
  notes: text("notes"),
  tenantId: integer("tenant_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, completed
  customerId: integer("customer_id"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  tenantId: integer("tenant_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  receiptUrl: text("receipt_url"),
  tenantId: integer("tenant_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Project User Assignments
export const projectUsers = pgTable("project_users", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 50 }).notNull().default("member"), // manager, member, viewer
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  tenantId: integer("tenant_id").notNull(),
}, (table) => ({
  uniqueProjectUser: unique().on(table.projectId, table.userId),
}));

// ==================== RELATIONS ====================

export const platformUsersRelations = relations(platformUsers, ({ many }) => ({
  // Platform users don't have direct relations to tenant data
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  projects: many(projects),
  timesheets: many(timesheets),
  expenses: many(expenses),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  timesheets: many(timesheets),
  expenses: many(expenses),
  projectUsers: many(projectUsers),
  createdCustomers: many(customers, { relationName: "createdBy" }),
  createdProjects: many(projects, { relationName: "createdBy" }),
  createdTasks: many(tasks, { relationName: "createdBy" }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
  projects: many(projects),
  createdBy: one(users, {
    fields: [customers.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  timesheets: many(timesheets),
  expenses: many(expenses),
  tasks: many(tasks),
  projectUsers: many(projectUsers),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  timesheets: many(timesheets),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
}));

export const projectUsersRelations = relations(projectUsers, ({ one }) => ({
  project: one(projects, {
    fields: [projectUsers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectUsers.userId],
    references: [users.id],
  }),
}));

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  user: one(users, {
    fields: [timesheets.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [timesheets.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [timesheets.taskId],
    references: [tasks.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
}));

// ==================== ZOD SCHEMAS ====================

// Platform Users
export const insertPlatformUserSchema = createInsertSchema(platformUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPlatformUserSchema = createSelectSchema(platformUsers);
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;
export type PlatformUser = z.infer<typeof selectPlatformUserSchema>;

// Tenants
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectTenantSchema = createSelectSchema(tenants);
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = z.infer<typeof selectTenantSchema>;

// Users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

// Customers
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectCustomerSchema = createSelectSchema(customers);
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = z.infer<typeof selectCustomerSchema>;

// Tasks
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectTaskSchema = createSelectSchema(tasks);
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = z.infer<typeof selectTaskSchema>;

// Projects
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectProjectSchema = createSelectSchema(projects);
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = z.infer<typeof selectProjectSchema>;

// Timesheets
export const insertTimesheetSchema = createInsertSchema(timesheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectTimesheetSchema = createSelectSchema(timesheets);
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = z.infer<typeof selectTimesheetSchema>;

// Expenses
export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectExpenseSchema = createSelectSchema(expenses);
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = z.infer<typeof selectExpenseSchema>;

// Project User Assignments
export const insertProjectUserSchema = createInsertSchema(projectUsers).omit({
  id: true,
  assignedAt: true,
});
export const selectProjectUserSchema = createSelectSchema(projectUsers);
export type InsertProjectUser = z.infer<typeof insertProjectUserSchema>;
export type ProjectUser = z.infer<typeof selectProjectUserSchema>;
