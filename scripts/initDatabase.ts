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

    // Create default permissions
    console.log('Creating default permissions...');
    const permissionData = [
      { name: 'manage_tenants', description: 'Create, update, and delete tenants' },
      { name: 'view_tenants', description: 'View all tenants' },
      { name: 'manage_admin_users', description: 'Create, update, and delete admin users' },
      { name: 'view_admin_users', description: 'View all admin users' },
      { name: 'manage_tenant_users', description: 'Create, update, and delete users within a tenant' },
      { name: 'view_tenant_users', description: 'View all users within a tenant' },
      { name: 'view_own_profile', description: 'View own user profile' },
      { name: 'edit_own_profile', description: 'Edit own user profile' },
      { name: 'view_audit_logs', description: 'View audit logs' },
    ];

    // Create permissions if they don't exist
    for (const permission of permissionData) {
      const existingPermission = await adminPrisma.permission.findUnique({
        where: { name: permission.name }
      });

      if (!existingPermission) {
        await adminPrisma.permission.create({
          data: permission
        });
      }
    }

    // Create default roles
    console.log('Creating default roles...');
    let superAdminRole = await adminPrisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      superAdminRole = await adminPrisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Full system access',
          isGlobal: true
        }
      });

      // Assign all permissions to Super Admin
      const allPermissions = await adminPrisma.permission.findMany();
      for (const permission of allPermissions) {
        await adminPrisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
      }
    }

    // Check for existing super admin user
    const existingAdmin = await adminPrisma.adminUser.findFirst({
      where: { email: 'admin@schoolsystem.com' }
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
          roleId: superAdminRole.id
        }
      });
      
      console.log('Created super admin user');
    } else if (!existingAdmin.roleId) {
      // Update existing admin to use the new role
      await adminPrisma.adminUser.update({
        where: { id: existingAdmin.id },
        data: { roleId: superAdminRole.id }
      });
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
      
      // Create permissions in tenant database
      console.log('Creating permissions in tenant database...');
      for (const permission of permissionData) {
        await tenantPrisma.permission.create({
          data: permission
        });
      }
      
      // Create tenant admin role
      console.log('Creating roles in tenant database...');
      const tenantAdminRole = await tenantPrisma.tenantRole.create({
        data: {
          name: 'TENANT_ADMIN',
          description: 'Administrator for this tenant',
        }
      });
      
      // Assign tenant-specific permissions to tenant admin
      const tenantPermissions = await tenantPrisma.permission.findMany({
        where: {
          name: {
            in: ['manage_tenant_users', 'view_tenant_users', 'view_own_profile', 'edit_own_profile', 'view_audit_logs']
          }
        }
      });
      
      for (const permission of tenantPermissions) {
        await tenantPrisma.tenantRolePermission.create({
          data: {
            tenantRoleId: tenantAdminRole.id,
            permissionId: permission.id
          }
        });
      }
      
      // Create student role
      const studentRole = await tenantPrisma.tenantRole.create({
        data: {
          name: 'STUDENT',
          description: 'Student with limited access',
        }
      });
      
      // Assign student permissions
      const studentPermissions = await tenantPrisma.permission.findMany({
        where: {
          name: {
            in: ['view_own_profile']
          }
        }
      });
      
      for (const permission of studentPermissions) {
        await tenantPrisma.tenantRolePermission.create({
          data: {
            tenantRoleId: studentRole.id,
            permissionId: permission.id
          }
        });
      }
      
      // Create tenant admin user
      const adminPassword = await bcrypt.hash('TenantAdmin123!', 10);
      const adminUser = await tenantPrisma.user.create({
        data: {
          id: uuidv4(),
          email: 'admin@email.com',
          password: adminPassword,
          firstName: 'Tenant',
          lastName: 'Admin',
          active: true
        }
      });
      
      // Assign tenant admin role to the user
      await tenantPrisma.userRole.create({
        data: {
          userId: adminUser.id,
          tenantRoleId: tenantAdminRole.id
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