import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

export default prisma;