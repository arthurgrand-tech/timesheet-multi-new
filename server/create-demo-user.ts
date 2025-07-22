import { createTenantStorage } from './storage';
import { hashPassword } from './auth';

async function createDemoTenantUser() {
  try {
    // Create tenant storage for demo tenant
    const tenantStorage = createTenantStorage(process.env.DATABASE_URL!);
    
    // Create demo user for the demo tenant
    const hashedPassword = await hashPassword('demo123');
    
    const demoUser = await tenantStorage.createUser({
      email: 'user@demo.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin',
      tenantId: 1, // demo tenant ID
      isActive: true,
    });

    console.log('Demo user created successfully:', demoUser.email);
    console.log('Login at: /tenant/demo/login with user@demo.com / demo123');
    
    // Create a sample customer for demo
    const sampleCustomer = await tenantStorage.createCustomer({
      customerId: 'DEMO001',
      name: 'Sample Customer',
      email: 'customer@example.com',
      status: 'active',
      address: '123 Main Street',
      city: 'Sample City',
      state: 'Sample State',
      pincode: '12345',
      tenantId: 1,
      createdById: demoUser.id,
    });

    console.log('Sample customer created:', sampleCustomer.name);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoTenantUser();