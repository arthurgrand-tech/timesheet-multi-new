# Multi-Tenant SaaS Application

## Overview
This is a comprehensive multi-tenant SaaS application successfully migrated from Figma to Replit. The application features separate databases per tenant, role-based access control, and a complete business management suite including customer tracking, project management, timesheets, and expense reporting.

## Project Architecture
- **Frontend**: React 18 with Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js server with TypeScript, JWT authentication
- **Database**: Multi-tenant architecture with Drizzle ORM and PostgreSQL
- **Authentication**: JWT-based with bcrypt password hashing and cookie sessions
- **State Management**: TanStack React Query for data fetching
- **Routing**: Wouter for frontend routing with platform/tenant separation

## Multi-Tenant Features
- **Complete Data Isolation**: Separate databases per tenant with configurable connection strings
- **Role-Based Access Control**: 
  - Platform Level: Super Admin, Product Owner
  - Tenant Level: Admin, Manager, User with granular permissions
- **Scalable Architecture**: Supports unlimited tenants with independent data and users
- **Business Management Suite**: Customer management, project tracking, timesheet logging, expense reporting

## Tech Stack
- **Runtime**: Node.js 20
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Wouter routing
- **Backend**: Express 4, TypeScript 5, JWT authentication, bcrypt
- **Database**: Drizzle ORM, PostgreSQL with multi-tenant schema
- **UI Components**: Radix UI, shadcn/ui with custom gradient theming
- **Security**: JWT tokens, bcrypt hashing, cookie-based sessions

## Authentication System
- **Platform Access**: `/platform/login` - Super Admin and Product Owner access
- **Tenant Access**: `/tenant/[subdomain]/login` - Tenant-specific user authentication  
- **Demo Credentials**:
  - Platform Admin: `admin@platform.com` / `admin123`
  - Tenant (demo): Access via `/tenant/demo/login`

## Recent Changes
- **2025-01-22**: Completed migration from Figma to Replit
- **2025-01-22**: Implemented multi-tenant database architecture with separate schemas
- **2025-01-22**: Built comprehensive authentication system with JWT and role-based access
- **2025-01-22**: Created complete API routes for platform and tenant operations
- **2025-01-22**: Developed full React frontend with platform/tenant routing
- **2025-01-22**: Successfully deployed with demo data and working authentication
- **2025-01-22**: Implemented full CRUD functionality for all business modules:
  - Employee/Resource Management with department, designation, role management
  - Project Management with customer linking and timeline tracking
  - Timesheet Management with project association and approval workflow
  - Customer Management with comprehensive contact information
- **2025-01-22**: Enhanced sidebar with company domain initial display (e.g., "D" for demo)
- **2025-01-22**: Professional UI styling matching enterprise application standards
- **2025-01-22**: Updated timesheet interface to match exact weekly layout with multiple task rows per project
- **2025-01-22**: Implemented comprehensive weekly timesheet grid with daily hour tracking and totals
- **2025-01-22**: **COMPLETED SUBSCRIPTION MANAGEMENT SYSTEM**:
  - Added Stripe integration with API keys configured (STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY)
  - Implemented three-tier subscription plans: Free, Standard ($15/month), Enterprise ($5/month)
  - Created comprehensive Settings page with subscription management, organization details, and billing information
  - Added database schema with stripe_customer_id and stripe_subscription_id fields
  - Implemented subscription upgrade, downgrade, and cancellation functionality
  - Integrated Settings page into sidebar navigation and routing system
  - Successfully tested login and subscription API endpoints - all functional
- **2025-01-22**: **IMPLEMENTING PROJECT ASSIGNMENT AND TASK MANAGEMENT**:
  - Enhanced database schema with project_users table for user-project assignments
  - Added project assignment API routes for assigning/removing users from projects
  - Implemented task management with project-specific task assignment
  - Modified timesheet interface to show only assigned projects for users
  - Storage layer updated with comprehensive project assignment functionality
  - API endpoints created for tasks, project assignments, and user management

## User Preferences
- Multi-tenant architecture with complete data isolation between tenants
- Role-based access control with User/Manager/Admin hierarchy within tenants
- Platform-level Super Admin for complete system management
- Responsive design optimized for laptop screens
- Model-based development approach for easy feature extensibility
- Full CRUD functionality required (create, edit, delete) for all business modules - no more static pages
- Company domain initial must be displayed prominently in top-left sidebar with proper alignment
- Professional enterprise design matching provided screenshots exactly

## Development Notes
- Application successfully running on port 5000 with full multi-tenant functionality
- Database schema deployed with platform users, tenants, and tenant-specific tables
- Authentication system operational with JWT tokens and secure password hashing
- Complete business workflow implemented with customer management as primary feature
- All dependencies installed and configured for production deployment