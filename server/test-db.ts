import { platformStorage } from './storage';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test getting platform user by email
    const user = await platformStorage.getPlatformUserByEmail('admin@platform.com');
    console.log('Found user:', user?.email);
    
    if (user) {
      console.log('Database connection working correctly!');
      console.log('User ID:', user.id);
      console.log('User role:', user.role);
      console.log('Is active:', user.isActive);
    } else {
      console.log('No user found with that email');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();