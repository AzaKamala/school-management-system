import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { body } from "express-validator";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "../../utils/jwt";
import { authenticateJWT } from "../../common/middlewares/authMiddleware";
import { rateLimitLogin } from "../../common/middlewares/rateLimitMiddleware";
import { getAdminUserByEmail } from "../../admin/queries/adminUserQueries";
import { getTenantUserByEmail } from "../../tenant/queries/userQueries";
import { getTenantById } from "../../admin/queries/tenantQueries";
import { getTenantPrismaClient, adminPrisma } from "../../utils/tenantContext";

const router = Router();
const validate = require("../../common/middlewares/validate");

const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("tenantId")
    .optional()
    .isUUID()
    .withMessage("Valid tenant ID is required if provided"),
  validate,
];

router.post(
  "/login",
  rateLimitLogin,
  loginValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, tenantId } = req.body;

      if (!tenantId) {
        const adminUser = await getAdminUserByEmail(email);

        if (!adminUser || !adminUser.active) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }

        const passwordMatch = await bcrypt.compare(
          password,
          adminUser.password
        );

        if (!passwordMatch) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }

        let permissions: string[] = [];
        let roleName = "ADMIN";

        if (adminUser.roleId) {
          const role = await adminPrisma.role.findUnique({
            where: { id: adminUser.roleId },
          });

          if (role) {
            roleName = role.name;

            const rolePermissions = await adminPrisma.rolePermission.findMany({
              where: { roleId: role.id },
              include: { permission: true },
            });

            permissions = rolePermissions.map((rp) => rp.permission.name);
          }
        }

        const accessToken = generateAccessToken({
          userId: adminUser.id,
          email: adminUser.email,
          isAdmin: true,
          roles: [roleName],
          permissions,
        });

        const refreshToken = await generateRefreshToken(adminUser.id, true);

        res.status(200).json({
          accessToken,
          refreshToken,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            isAdmin: true,
          },
        });
        return;
      } else {
        const tenant = await getTenantById(tenantId);

        if (!tenant || !tenant.active) {
          res.status(401).json({ error: "Invalid tenant" });
          return;
        }

        const tenantUser = await getTenantUserByEmail(tenantId, email);

        if (!tenantUser || !tenantUser.active) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }

        if (!tenantUser.password) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }

        const passwordMatch = await bcrypt.compare(
          password,
          tenantUser.password
        );

        if (!passwordMatch) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }

        const tenantPrisma = await getTenantPrismaClient(tenantId);
        const userRoles = await tenantPrisma.userRole.findMany({
          where: { userId: tenantUser.id },
          include: { tenantRole: true },
        });

        const roleIds = userRoles.map((ur) => ur.tenantRoleId);
        const roleNames = userRoles.map((ur) => ur.tenantRole.name);

        const rolePermissions =
          await tenantPrisma.tenantRolePermission.findMany({
            where: {
              tenantRoleId: { in: roleIds },
            },
            include: { permission: true },
          });

        const permissions = rolePermissions.map((rp) => rp.permission.name);

        const accessToken = generateAccessToken({
          userId: tenantUser.id,
          email: tenantUser.email,
          isAdmin: false,
          tenantId,
          roles: roleNames,
          permissions,
        });

        const refreshToken = await generateRefreshToken(
          tenantUser.id,
          false,
          tenantId
        );

        res.status(200).json({
          accessToken,
          refreshToken,
          user: {
            id: tenantUser.id,
            email: tenantUser.email,
            firstName: tenantUser.firstName,
            lastName: tenantUser.lastName,
            isAdmin: false,
            tenantId,
          },
        });
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }
);

router.post(
  "/refresh-token",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }

      const tokenData = await verifyRefreshToken(refreshToken);

      if (!tokenData) {
        res.status(401).json({ error: "Invalid or expired refresh token" });
        return;
      }

      await revokeRefreshToken(tokenData.id);

      let userInfo;
      let permissions: string[] = [];
      let roles: string[] = [];

      if (tokenData.adminUser) {
        const adminUser = await adminPrisma.adminUser.findUnique({
          where: { id: tokenData.userId },
        });

        if (!adminUser || !adminUser.active) {
          res.status(401).json({ error: "User not found or inactive" });
          return;
        }

        userInfo = adminUser;

        if (adminUser.roleId) {
          const role = await adminPrisma.role.findUnique({
            where: { id: adminUser.roleId },
          });

          if (role) {
            roles = [role.name];

            const rolePermissions = await adminPrisma.rolePermission.findMany({
              where: { roleId: role.id },
              include: { permission: true },
            });

            permissions = rolePermissions.map((rp) => rp.permission.name);
          }
        }
      } else {
        if (!tokenData.tenantId) {
          res.status(400).json({ error: "Invalid token data" });
          return;
        }

        const tenantPrisma = await getTenantPrismaClient(tokenData.tenantId);
        const tenantUser = await tenantPrisma.user.findUnique({
          where: { id: tokenData.userId },
        });

        if (!tenantUser || !tenantUser.active) {
          res.status(401).json({ error: "User not found or inactive" });
          return;
        }

        userInfo = tenantUser;

        const userRoles = await tenantPrisma.userRole.findMany({
          where: { userId: tenantUser.id },
          include: { tenantRole: true },
        });

        roles = userRoles.map((ur) => ur.tenantRole.name);

        const roleIds = userRoles.map((ur) => ur.tenantRoleId);
        const rolePermissions =
          await tenantPrisma.tenantRolePermission.findMany({
            where: {
              tenantRoleId: { in: roleIds },
            },
            include: { permission: true },
          });

        permissions = rolePermissions.map((rp) => rp.permission.name);
      }

      const accessToken = generateAccessToken({
        userId: userInfo.id,
        email: userInfo.email,
        isAdmin: tokenData.adminUser,
        tenantId: tokenData.tenantId,
        roles,
        permissions,
      });

      const newRefreshToken = await generateRefreshToken(
        userInfo.id,
        tokenData.adminUser,
        tokenData.tenantId
      );

      await revokeRefreshToken(tokenData.id);

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
      return;
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }
);

router.post(
  "/logout",
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        const tokenData = await verifyRefreshToken(refreshToken);

        if (tokenData) {
          await revokeRefreshToken(tokenData.id);
        }
      }

      res.status(200).json({ message: "Logged out successfully" });
      return;
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }
);

export default router;
