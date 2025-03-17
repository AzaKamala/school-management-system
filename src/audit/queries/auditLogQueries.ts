import { LoginEvent } from "../../utils/rabbitmq";
import { getTenantPrismaClient } from "../../utils/tenantContext";
import { PrismaClient as AdminPrismaClient } from "@prisma/admin-client";

const adminPrisma = new AdminPrismaClient();

export async function createAuditLog(event: LoginEvent) {
  try {
    console.log(`Creating audit log for ${event.email}`);
    if (!event.tenantId) {
      return await adminPrisma.auditLog.create({
        data: {
          userId: event.userId,
          action: event.action,
          status: event.status,
          ip: event.ip,
          userAgent: event.userAgent,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      });
    }

    const tenantPrisma = await getTenantPrismaClient(event.tenantId);
    return await tenantPrisma.auditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        status: event.status,
        ip: event.ip,
        userAgent: event.userAgent,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    });
  } catch (error) {
    console.error(`Error creating audit log:`, error);
    throw error;
  }
}

export async function getAuditLogs(
  tenantId: string,
  options: {
    userId?: string;
    status?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  try {
    const tenantPrisma = await getTenantPrismaClient(tenantId);

    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.status) where.status = options.status;
    if (options.action) where.action = options.action;

    if (options.startDate && options.endDate) {
      where.createdAt = {
        gte: options.startDate,
        lte: options.endDate,
      };
    } else if (options.startDate) {
      where.createdAt = { gte: options.startDate };
    } else if (options.endDate) {
      where.createdAt = { lte: options.endDate };
    }

    const auditLogs = await tenantPrisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options.limit || 100,
      skip: options.offset || 0,
    });

    return auditLogs;
  } catch (error) {
    console.error(`Error fetching audit logs for tenant ${tenantId}:`, error);
    throw error;
  }
}

export async function getAdminAuditLogs(
  options: {
    userId?: string;
    status?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  try {
    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.status) where.status = options.status;
    if (options.action) where.action = options.action;

    if (options.startDate && options.endDate) {
      where.createdAt = {
        gte: options.startDate,
        lte: options.endDate,
      };
    } else if (options.startDate) {
      where.createdAt = { gte: options.startDate };
    } else if (options.endDate) {
      where.createdAt = { lte: options.endDate };
    }

    const auditLogs = await adminPrisma.auditLog.findMany({
      where,
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options.limit || 100,
      skip: options.offset || 0,
    });

    return auditLogs;
  } catch (error) {
    console.error(`Error fetching admin audit logs:`, error);
    throw error;
  }
}
