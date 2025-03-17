import { Router, Request, Response } from "express";
import { getAuditLogs } from "../queries/auditLogQueries";
import {
  authenticateJWT,
  requirePermission,
  requireTenantAccess,
} from "../../common/middlewares/authMiddleware";
import { rateLimitAPI } from "../../common/middlewares/rateLimitMiddleware";
import { param, query } from "express-validator";

const router = Router({ mergeParams: true });
const validate = require("../../common/middlewares/validate");

const auditLogQueryValidator = [
  param("tenantId").isUUID(4).withMessage("Valid tenant ID is required"),
  query("status").optional().isString(),
  query("action").optional().isString(),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Valid ISO date required for startDate"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Valid ISO date required for endDate"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Limit must be between 1 and 1000"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a positive number"),
  validate,
];

router.get(
  "/",
  rateLimitAPI,
  authenticateJWT,
  requireTenantAccess,
  requirePermission("view_audit_logs"),
  auditLogQueryValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const {
        status,
        action,
        userId,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: limitStr,
        offset: offsetStr,
      } = req.query;

      const userIdFilter =
        req.user?.isAdmin || req.user?.permissions.includes("view_tenant_users")
          ? (userId as string)
          : req.user?.userId;

      const startDate = startDateStr
        ? new Date(startDateStr as string)
        : undefined;
      const endDate = endDateStr ? new Date(endDateStr as string) : undefined;
      const limit = limitStr ? parseInt(limitStr as string) : 100;
      const offset = offsetStr ? parseInt(offsetStr as string) : 0;

      const auditLogs = await getAuditLogs(tenantId, {
        userId: userIdFilter,
        status: status as string,
        action: action as string,
        startDate,
        endDate,
        limit,
        offset,
      });

      res.status(200).json({
        data: auditLogs,
        pagination: {
          limit,
          offset,
          totalCount: auditLogs.length,
        },
      });
    } catch (error) {
      console.error(`Error fetching audit logs:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
