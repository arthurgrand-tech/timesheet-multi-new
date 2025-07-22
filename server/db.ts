import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Main platform database connection with better timeout handling
const platformPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 8000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
});

// Handle connection errors
platformPool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export const platformDb = drizzle(platformPool, { schema });

// Dynamic tenant database connections
const tenantConnections = new Map<string, ReturnType<typeof drizzle>>();

export function getTenantDb(connectionString: string) {
  if (!tenantConnections.has(connectionString)) {
    const tenantPool = new Pool({ 
      connectionString,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });
    
    tenantPool.on('error', (err) => {
      console.error('Tenant PostgreSQL pool error:', err);
    });
    
    tenantConnections.set(connectionString, drizzle(tenantPool, { schema }));
  }
  return tenantConnections.get(connectionString)!;
}

// For backward compatibility and main platform operations
export const db = platformDb;