import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createTenant = async (name: string, schemaName: string) => {
  try {
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        schemaName,
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

export const getTenantBySchemaName = async (schemaName: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        schemaName,
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
        select: { schemaName: true }
    });

    if (!tenant) throw new Error('Tenant not found');

    await prisma.tenant.delete({
      where: {
        id,
      },
    });

    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${tenant.schemaName}" CASCADE`);
  } catch (error) {
    throw error;
  }
};
