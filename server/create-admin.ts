import { platformStorage } from './storage';
import { hashPassword } from './auth';

async function createSuperAdmin() {
  try {
    // Create default super admin user
    const hashedPassword = await hashPassword('admin123');
    
    const superAdmin = await platformStorage.createPlatformUser({
      email: 'admin@platform.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true,
    });

    console.log('Super Admin created successfully:', superAdmin.email);
    
    // Create a demo tenant
    const demoTenant = await platformStorage.createTenant({
      name: 'Demo Company',
      subdomain: 'demo',
      subscriptionPlan: 'premium',
      maxUsers: 50,
      status: 'active',
    });

    console.log('Demo tenant created successfully:', demoTenant.subdomain);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();