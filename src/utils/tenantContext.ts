import { PrismaClient as AdminPrismaClient } from '@prisma/admin-client';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getTenantById } from '../admin/queries/tenantQueries';

// Create a map to cache TenantPrismaClient instances for each tenant
const tenantClients: Record<string, TenantPrismaClient> = {};

// Main admin database client
const adminPrisma = new AdminPrismaClient();

export async function getTenantPrismaClient(tenantId: string): Promise<TenantPrismaClient> {
    const tenant = await getTenantById(tenantId);
  
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    
    if (!tenant.active) {
      throw new Error(`Tenant ${tenant.name} is not active`);
    }
    
    // Check if we already have a client for this tenant
    if (tenantClients[tenant.id]) {
      return tenantClients[tenant.id];
    }
    
    // Create a new PrismaClient for this tenant's database
    const dbUrl = `${process.env.DATABASE_URL?.replace(/\/[^/]+$/, '')}/${tenant.databaseName}`;
    const tenantPrisma = new TenantPrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    
    // Cache the client for future use
    tenantClients[tenant.id] = tenantPrisma;
    
    return tenantPrisma;
}

export async function createTenantDatabase(databaseName: string): Promise<void> {
  console.log(`Creating database for tenant: ${databaseName}`);
  
  try {
    // First connect to postgres to create a new database
    const adminDbUrl = process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/postgres');
    
    // Create a temporary client to create the database
    const tempAdminPrisma = new AdminPrismaClient({
      datasources: { db: { url: adminDbUrl } }
    });
    
    // Check if database exists
    const dbExists = await tempAdminPrisma.$queryRaw`
      SELECT 1 FROM pg_database WHERE datname = ${databaseName}
    `;
    
    if (!Array.isArray(dbExists) || dbExists.length === 0) {
      // Create the database
      await tempAdminPrisma.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    }
    
    await tempAdminPrisma.$disconnect();
    
    // Apply schema to the new database
    const dbUrl = `${process.env.DATABASE_URL?.replace(/\/[^/]+$/, '')}/${databaseName}`;
    const env = { ...process.env, TENANT_DATABASE_URL: dbUrl };
    
    console.log(`Pushing schema to database ${databaseName} using URL: ${dbUrl}`);
    execSync(`npx prisma db push --schema="./prisma/tenant.prisma"`, {
      stdio: 'inherit',
      env: env
    });
    
    console.log(`Successfully initialized database for tenant: ${databaseName}`);
  } catch (error) {
    console.error(`Error initializing tenant database ${databaseName}:`, error);
    throw error;
  }
}

export { adminPrisma };