import Router from "express";
import { Request, Response } from "express";
import {
  createTenant,
  deleteTenant,
  getTenantByDatabaseName,
  getTenantById,
  getTenants,
  updateTenant,
} from "../queries/tenantQueries";
import {
  createTenantValidator,
  requiredIdParam,
  updateTenantValidator,
} from "../middlewares/tenantMiddleware";
import TenantDTO from "../DTOs/tenantDTO";
import { createTenantDatabase } from "../../utils/tenantContext";
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
  requirePermission("manage_tenants"),
  createTenantValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, databaseName } = req.body;

      const existingTenant = await getTenantByDatabaseName(databaseName);
      if (existingTenant) {
        res.status(400).json({ error: "Database name already exists" });
        return;
      }

      await createTenantDatabase(databaseName);

      const tenant = await createTenant(name, databaseName);

      res.status(201).send(TenantDTO.fromObject(tenant));
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
  requirePermission("view_tenants"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenants = await getTenants();

      res.status(200).send(tenants.map(TenantDTO.fromObject));
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
  requiredIdParam,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.user?.isAdmin && req.user?.tenantId !== id) {
        res.status(403).json({ error: "Access denied for this tenant" });
        return;
      }

      const tenant = await getTenantById(id);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      res.status(200).send(TenantDTO.fromObject(tenant));
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
  requirePermission("manage_tenants"),
  updateTenantValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, active } = req.body;

      const tenant = await getTenantById(id);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const updatedTenant = await updateTenant(id, name, active);

      res.status(200).send(TenantDTO.fromObject(updatedTenant));
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
  requirePermission("manage_tenants"),
  requiredIdParam,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const tenant = await getTenantById(id);
      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      await deleteTenant(id);

      res.status(200).json({ message: "Tenant deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  }
);

export default router;
