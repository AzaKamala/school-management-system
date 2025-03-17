import bcrypt from 'bcryptjs';
import { getTenantPrismaClient } from '../../utils/tenantContext';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export const createTenantUser = async (
  tenantId: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string
) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Now this is properly typed with the tenant schema
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        active: true
      }
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const getTenantUsers = async (tenantId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);
    
    const users = await prisma.user.findMany();
    
    return users;
  } catch (error) {
    throw error;
  }
};

export const getTenantUserById = async (tenantId: string, userId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);
    
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
    const prisma = await getTenantPrismaClient(tenantId);
    
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
    const prisma = await getTenantPrismaClient(tenantId);
    
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
    const prisma = await getTenantPrismaClient(tenantId);
    
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  } catch (error) {
    throw error;
  }
};