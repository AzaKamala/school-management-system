import bcrypt from "bcryptjs";
import { getTenantPrismaClient } from "../../utils/tenantContext";
import { v4 as uuidv4 } from "uuid";

export const createTenantUser = async (
  tenantId: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  roleIds: string[] = []
) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = uuidv4();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        active: true,
      },
    });

    if (roleIds.length > 0) {
      for (const roleId of roleIds) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            tenantRoleId: roleId,
          },
        });
      }
    }

    return user;
  } catch (error) {
    throw error;
  }
};

export const getTenantUsers = async (tenantId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);

    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            tenantRole: true,
          },
        },
      },
    });

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
      include: {
        userRoles: {
          include: {
            tenantRole: true,
          },
        },
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
      include: {
        userRoles: {
          include: {
            tenantRole: true,
          },
        },
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
      include: {
        userRoles: {
          include: {
            tenantRole: true,
          },
        },
      },
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

export const getUserRoles = async (tenantId: string, userId: string) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
      },
      include: {
        tenantRole: true,
      },
    });

    return userRoles.map((ur) => ur.tenantRole);
  } catch (error) {
    throw error;
  }
};

export const assignUserRole = async (
  tenantId: string,
  userId: string,
  roleId: string
) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);

    const existing = await prisma.userRole.findFirst({
      where: {
        userId,
        tenantRoleId: roleId,
      },
    });

    if (!existing) {
      await prisma.userRole.create({
        data: {
          userId,
          tenantRoleId: roleId,
        },
      });
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export const removeUserRole = async (
  tenantId: string,
  userId: string,
  roleId: string
) => {
  try {
    const prisma = await getTenantPrismaClient(tenantId);

    await prisma.userRole.deleteMany({
      where: {
        userId,
        tenantRoleId: roleId,
      },
    });

    return true;
  } catch (error) {
    throw error;
  }
};
