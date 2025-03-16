import bcrypt from 'bcryptjs';
import { getTenantPrismaClient } from '../../utils/tenantContext';
import { PrismaClient } from '@prisma/client';

export const createTenantUser = async (
  tenantId: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string
) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId) as PrismaClient & { 
      user: { 
        create: Function; 
        findMany: Function; 
        findUnique: Function; 
        update: Function;
        delete: Function;
      } 
    };
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const getTenantUsers = async (tenantId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId) as PrismaClient & { 
      user: { 
        create: Function; 
        findMany: Function; 
        findUnique: Function; 
        update: Function;
        delete: Function;
      } 
    };
    
    const users = await prisma.$queryRaw`SELECT * FROM "User"`;
    
    return users;
  } catch (error) {
    throw error;
  }
};

export const getTenantUserById = async (tenantId: string, userId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId) as PrismaClient & { 
      user: { 
        create: Function; 
        findMany: Function; 
        findUnique: Function; 
        update: Function;
        delete: Function;
      } 
    };
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const getTenantUserByEmail = async (tenantId: string, email: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId) as PrismaClient & { 
      user: { 
        create: Function; 
        findMany: Function; 
        findUnique: Function; 
        update: Function;
        delete: Function;
      } 
    };
    
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const updateTenantUser = async (
  tenantId: string,
  userId: string,
  data: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    active?: boolean;
  }
) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId) as PrismaClient & { 
      user: { 
        create: Function; 
        findMany: Function; 
        findUnique: Function; 
        update: Function;
        delete: Function;
      } 
    };
    
    const updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const deleteTenantUser = async (tenantId: string, userId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId) as PrismaClient & { 
      user: { 
        create: Function; 
        findMany: Function; 
        findUnique: Function; 
        update: Function;
        delete: Function;
      } 
    };
    
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  } catch (error) {
    throw error;
  }
};