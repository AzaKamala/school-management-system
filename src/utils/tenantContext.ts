import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getTenantById } from '../admin/queries/tenantQueries';

const prisma = new PrismaClient();

const prismaClients: Record<string, PrismaClient> = {};

export async function createTenantSchema(schemaName: string): Promise<void> {
  console.log(`Initializing schema for tenant: ${schemaName}`);
  
  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    const templatePath = path.join(__dirname, '..', '..', 'prisma', 'tenant-template.prisma');
    let templateContent = fs.readFileSync(templatePath, 'utf8');
    
    templateContent = templateContent.replace(/\{\{SCHEMA_NAME\}\}/g, schemaName);
    
    const tempDir = path.join(__dirname, '..', '..', 'prisma', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempSchemaPath = path.join(tempDir, `temp-${schemaName}-${Date.now()}.prisma`);
    fs.writeFileSync(tempSchemaPath, templateContent);
    
    const env = { ...process.env };
    
    console.log(`Pushing schema using ${tempSchemaPath}`);
    execSync(`npx prisma db push --schema="${tempSchemaPath}" --accept-data-loss`, {
      stdio: 'inherit',
      env: env
    });
    
    fs.unlinkSync(tempSchemaPath);
    
    console.log(`Successfully initialized schema for tenant: ${schemaName}`);
  } catch (error) {
    console.error(`Error initializing tenant schema ${schemaName}:`, error);
    throw error;
  }
}

export async function getTenantPrismaClient(tenantId: string): Promise<PrismaClient> {
  if (prismaClients[tenantId]) {
    return prismaClients[tenantId];
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found`);
  }

  if (!tenant.active) {
    throw new Error(`Tenant ${tenant.name} is not active`);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?currentSchema=${tenant.schemaName}`
      },
    },
  });

  prismaClients[tenantId] = prisma;
  return prisma;
}

export default prisma;
