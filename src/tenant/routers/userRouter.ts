import express from "express";
import { Request, Response } from "express";
import {
  createTenantUser,
  deleteTenantUser,
  getTenantUserByEmail,
  getTenantUserById,
  getTenantUsers,
  updateTenantUser,
  getUserRoles,
  assignUserRole,
  removeUserRole,
} from "../queries/userQueries";
import {
  createTenantUserValidator,
  updateTenantUserValidator,
  validateTenantId,
  assignRoleValidator,
} from "../middlewares/userMiddleware";
import TenantUserDTO from "../DTOs/userDTO";
import { getTenantById } from "../../admin/queries/tenantQueries";
import {
  authenticateJWT,
  requirePermission,
  requireTenantAccess,
} from "../../common/middlewares/authMiddleware";
import { rateLimitAPI } from "../../common/middlewares/rateLimitMiddleware";

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  requirePermission("manage_tenant_users"),
  createTenantUserValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const { email, password, firstName, lastName, roles } = req.body;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const existingUser = await getTenantUserByEmail(tenantId, email);
      if (existingUser) {
        res.status(400).json({ error: "Email already exists in this tenant" });
        return;
      }

      const user = await createTenantUser(
        tenantId,
        email,
        password,
        firstName,
        lastName,
        roles
      );

      res.status(201).json(TenantUserDTO.fromObject(user));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  requirePermission("view_tenant_users"),
  validateTenantId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const users = await getTenantUsers(tenantId);

      res.status(200).json(users.map(TenantUserDTO.fromObject));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/:id",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  validateTenantId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, id } = req.params;

      if (
        !req.user?.isAdmin &&
        req.user?.userId !== id &&
        !req.user?.permissions.includes("view_tenant_users")
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const user = await getTenantUserById(tenantId, id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json(TenantUserDTO.fromObject(user));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/:id",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  updateTenantUserValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, id } = req.params;
      const { email, password, firstName, lastName, active } = req.body;

      if (
        !req.user?.isAdmin &&
        req.user?.userId !== id &&
        !req.user?.permissions.includes("manage_tenant_users")
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const existingUser = await getTenantUserById(tenantId, id);
      if (!existingUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (email && email !== existingUser.email) {
        const userWithEmail = await getTenantUserByEmail(tenantId, email);
        if (userWithEmail) {
          res
            .status(400)
            .json({ error: "Email already exists in this tenant" });
          return;
        }
      }

      const updatedUser = await updateTenantUser(tenantId, id, {
        email,
        password,
        firstName,
        lastName,
        active,
      });

      res.status(200).json(TenantUserDTO.fromObject(updatedUser));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete(
  "/:id",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  requirePermission("manage_tenant_users"),
  validateTenantId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, id } = req.params;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const existingUser = await getTenantUserById(tenantId, id);
      if (!existingUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await deleteTenantUser(tenantId, id);

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/:id/roles",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  validateTenantId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, id } = req.params;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const user = await getTenantUserById(tenantId, id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const roles = await getUserRoles(tenantId, id);
      res.status(200).json(roles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/:id/roles",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  requirePermission("manage_tenant_users"),
  assignRoleValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, id } = req.params;
      const { roleId } = req.body;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const user = await getTenantUserById(tenantId, id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await assignUserRole(tenantId, id, roleId);
      res.status(200).json({ message: "Role assigned successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete(
  "/:id/roles/:roleId",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  requirePermission("manage_tenant_users"),
  validateTenantId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, id, roleId } = req.params;

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const user = await getTenantUserById(tenantId, id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await removeUserRole(tenantId, id, roleId);
      res.status(200).json({ message: "Role removed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
