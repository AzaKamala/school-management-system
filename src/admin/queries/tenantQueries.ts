import { PrismaClient as AdminPrismaClient } from '@prisma/admin-client';

const prisma = new AdminPrismaClient();

export const createTenant = async (name: string, databaseName: string) => {
  try {
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        databaseName,
      },
    });

    return newTenant;
  } catch (error) {
    throw error;
  }
};

export const getTenants = async () => {
  try {
    const tenants = await prisma.tenant.findMany();

    return tenants;
  } catch (error) {
    throw error;
  }
};

export const getTenantById = async (id: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        id,
      },
    });

    return tenant;
  } catch (error) {
    throw error;
  }
};

export const getTenantByDatabaseName = async (databaseName: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        databaseName,
      },
    });

    return tenant;
  } catch (error) {
    throw error;
  }
};

export const updateTenant = async (
  id: string,
  name?: string,
  active?: boolean
) => {
  try {
    const data: any = {};

    if (name) data.name = name;
    if (active !== undefined) data.active = active;

    const updatedTenant = await prisma.tenant.update({
      where: {
        id,
      },
      data,
    });

    return updatedTenant;
  } catch (error) {
    throw error;
  }
};

export const deleteTenant = async (id: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({
        where: { id },
        select: { databaseName: true }
    });

    if (!tenant) throw new Error('Tenant not found');

    await prisma.tenant.delete({
      where: {
        id,
      },
    });

    await prisma.$executeRawUnsafe(`DROP DATABASE "${tenant.databaseName}" WITH (FORCE)`);
  } catch (error) {
    throw error;
  }
};
