import * as dotenv from 'dotenv';
import prisma, { createTenantSchema } from '../src/utils/tenantContext';
import * as bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function initDatabase() {
  try {
    console.log('Starting database initialization...');

    console.log('Creating admin schema...');
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "admin"`);

    console.log('Pushing main Prisma schema...');
    const env = { ...process.env };
    execSync('npx prisma db push', {
      stdio: 'inherit',
      env
    });

    const existingAdmin = await prisma.adminUser.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!existingAdmin) {
      console.log('Creating super admin user...');
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
      
      await prisma.adminUser.create({
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
    
    const existingTenants = await prisma.tenant.findMany({
      take: 1
    });
    
    if (existingTenants.length === 0) {
      console.log('Creating test tenant...');
      
      const testSchemaName = 'tenant_test';
      
      await createTenantSchema(testSchemaName);
      
      const testTenant = await prisma.tenant.create({
        data: {
          name: 'Test School',
          schemaName: testSchemaName,
        }
      });
      
      console.log('Creating demo users in tenant schema...');
      
      const adminPassword = await bcrypt.hash('TenantAdmin123!', 10);
      const adminId = await createTenantUser(testSchemaName, {
        id: uuidv4(),
        email: 'admin@email.com',
        password: adminPassword,
        firstName: 'Tenant',
        lastName: 'Admin',
        role: 'TENANT_ADMIN'
      });
      
      console.log('Created demo school with users and classes');
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTenantUser(schemaName: string, user: { 
  id: string, 
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  role: string 
}): Promise<string> {
  const id = user.id;
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO "${schemaName}"."User" (
      "id", "email", "password", "firstName", "lastName", "role", "active", "createdAt", "updatedAt"
    ) VALUES (
      '${id}', 
      '${user.email}', 
      '${user.password}', 
      '${user.firstName}', 
      '${user.lastName}', 
      '${user.role}', 
      true, 
      NOW(), 
      NOW()
    )
  `);
  
  return id;
}

initDatabase();