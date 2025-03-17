import { PrismaClient as AdminPrismaClient } from "@prisma/admin-client";
import bcrypt from "bcryptjs";

const prisma = new AdminPrismaClient();

export const createAdminUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  roleId: string
) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdminUser = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId,
      },
      include: {
        assignedRole: true,
      },
    });

    return newAdminUser;
  } catch (error) {
    throw error;
  }
};

export const getAdminUsers = async () => {
  try {
    const adminUsers = await prisma.adminUser.findMany({
      include: {
        assignedRole: true,
      },
    });

    return adminUsers;
  } catch (error) {
    throw error;
  }
};

export const getAdminUserById = async (id: string) => {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: {
        id,
      },
      include: {
        assignedRole: true,
      },
    });

    return adminUser;
  } catch (error) {
    throw error;
  }
};

export const getAdminUserByEmail = async (email: string) => {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: {
        email,
      },
      include: {
        assignedRole: true,
      },
    });

    return adminUser;
  } catch (error) {
    throw error;
  }
};

export const updateAdminUser = async (
  id: string,
  email?: string,
  password?: string,
  firstName?: string,
  lastName?: string,
  roleId?: string,
  active?: boolean
) => {
  try {
    const data: any = {};

    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email) data.email = email;
    if (roleId) data.roleId = roleId;
    if (active !== undefined) data.active = active;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedAdminUser = await prisma.adminUser.update({
      where: {
        id,
      },
      data,
      include: {
        assignedRole: true,
      },
    });

    return updatedAdminUser;
  } catch (error) {
    throw error;
  }
};

export const deleteAdminUser = async (id: string) => {
  try {
    await prisma.adminUser.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    throw error;
  }
};
