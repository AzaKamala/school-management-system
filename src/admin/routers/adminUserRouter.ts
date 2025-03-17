import Router from "express";
import { Request, Response } from "express";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserByEmail,
  getAdminUserById,
  getAdminUsers,
  updateAdminUser,
} from "../queries/adminUserQueries";
import {
  createAdminUserValidator,
  requiredIdParam,
  updateAdminUserValidator,
} from "../middlewares/adminUserMiddleware";
import AdminUserDTO from "../DTOs/adminUserDTO";
import { adminPrisma } from "../../utils/tenantContext";
import {
  authenticateJWT,
  requireAdmin,
  requirePermission,
} from "../../common/middlewares/authMiddleware";
import { rateLimitAPI } from "../../common/middlewares/rateLimitMiddleware";

const router = Router();

router.post(
  "/",
  rateLimitAPI,
  authenticateJWT,
  requireAdmin,
  requirePermission("manage_admin_users"),
  createAdminUserValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, password, email, roleId } = req.body;

      const existingAdminUser = await getAdminUserByEmail(email);
      if (existingAdminUser) {
        res.status(400).json({ error: "Email already exists" });
        return;
      }

      const role = await adminPrisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        res.status(400).json({ error: "Invalid role ID" });
        return;
      }

      const adminUser = await createAdminUser(
        email,
        password,
        firstName,
        lastName,
        roleId
      );

      res.status(201).send(AdminUserDTO.fromObject(adminUser));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  }
);

router.get(
  "/",
  rateLimitAPI,
  authenticateJWT,
  requireAdmin,
  requirePermission("view_admin_users"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUsers = await getAdminUsers();

      res.status(200).send(adminUsers.map(AdminUserDTO.fromObject));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  }
);

router.get(
  "/:id",
  rateLimitAPI,
  authenticateJWT,
  requireAdmin,
  requirePermission("view_admin_users"),
  requiredIdParam,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const adminUser = await getAdminUserById(id);
      if (!adminUser) {
        res.status(404).json({ error: "Admin user not found" });
        return;
      }

      res.status(200).send(AdminUserDTO.fromObject(adminUser));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  }
);

router.put(
  "/:id",
  rateLimitAPI,
  authenticateJWT,
  requireAdmin,
  requirePermission("manage_admin_users"),
  updateAdminUserValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { firstName, lastName, password, active, email, roleId } = req.body;

      const adminUser = await getAdminUserById(id);
      if (!adminUser) {
        res.status(404).json({ error: "Admin user not found" });
        return;
      }

      if (email) {
        const existingAdminUserEmail = await getAdminUserByEmail(email);
        if (
          existingAdminUserEmail &&
          existingAdminUserEmail.email !== adminUser.email
        ) {
          res.status(400).json({ error: "Email already exists!" });
          return;
        }
      }

      if (roleId) {
        const role = await adminPrisma.role.findUnique({
          where: { id: roleId },
        });

        if (!role) {
          res.status(400).json({ error: "Invalid role ID" });
          return;
        }
      }

      const updatedAdminUser = await updateAdminUser(
        id,
        email,
        password,
        firstName,
        lastName,
        roleId,
        active
      );

      res.status(200).send(AdminUserDTO.fromObject(updatedAdminUser));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  }
);

router.delete(
  "/:id",
  rateLimitAPI,
  authenticateJWT,
  requireAdmin,
  requirePermission("manage_admin_users"),
  requiredIdParam,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const adminUser = await getAdminUserById(id);
      if (!adminUser) {
        res.status(404).json({ error: "Admin user not found" });
        return;
      }

      await deleteAdminUser(id);

      res.status(200).json({ message: "Admin user deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  }
);

export default router;
