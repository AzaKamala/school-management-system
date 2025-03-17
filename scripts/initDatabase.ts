import * as dotenv from 'dotenv';
import { adminPrisma, createTenantDatabase } from '../src/utils/tenantContext';
import * as bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

dotenv.config();

async function initDatabase() {
  try {
    console.log('Starting database initialization...');

    console.log('Pushing admin Prisma schema...');
    const env = { ...process.env };
    execSync('npx prisma db push --schema=./prisma/admin.prisma', {
      stdio: 'inherit',
      env
    });

    const existingAdmin = await adminPrisma.adminUser.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!existingAdmin) {
      console.log('Creating super admin user...');
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
      
      await adminPrisma.adminUser.create({
        data: {
          email: 'admin@schoolsystem.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
        }
      });
      
      console.log('Created super admin user');
    }
    
    const existingTenants = await adminPrisma.tenant.findMany({
      take: 1
    });
    
    if (existingTenants.length === 0) {
      console.log('Creating test tenant...');
      
      const testDatabaseName = 'tenant_test';
      
      // Create the tenant database
      await createTenantDatabase(testDatabaseName);
      
      // Register the tenant in admin database
      const testTenant = await adminPrisma.tenant.create({
        data: {
          name: 'Test School',
          databaseName: testDatabaseName,
        }
      });
      
      console.log('Creating demo users in tenant database...');
      
      // Connect directly to the tenant database
      const dbUrl = `${process.env.DATABASE_URL?.replace(/\/[^/]+$/, '')}/${testDatabaseName}`;
      const tenantPrisma = new TenantPrismaClient({
        datasources: {
          db: {
            url: dbUrl
          }
        }
      });
      
      // Create tenant admin user
      const adminPassword = await bcrypt.hash('TenantAdmin123!', 10);
      await tenantPrisma.user.create({
        data: {
          id: uuidv4(),
          email: 'admin@email.com',
          password: adminPassword,
          firstName: 'Tenant',
          lastName: 'Admin',
          role: 'TENANT_ADMIN',
          active: true
        }
      });
      
      await tenantPrisma.$disconnect();
      
      console.log('Created demo school with users');
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await adminPrisma.$disconnect();
  }
}

initDatabase();