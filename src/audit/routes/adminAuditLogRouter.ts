import { Router, Request, Response } from "express";
import { getAdminAuditLogs } from "../queries/auditLogQueries";
import {
  authenticateJWT,
  requireAdmin,
  requirePermission,
} from "../../common/middlewares/authMiddleware";
import { rateLimitAPI } from "../../common/middlewares/rateLimitMiddleware";
import { query } from "express-validator";

const router = Router();
const validate = require("../../common/middlewares/validate");

const adminAuditLogQueryValidator = [
  query("status").optional().isString(),
  query("action").optional().isString(),
  query("userId").optional().isUUID(4).withMessage("Valid user ID is required"),
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
  requireAdmin,
  requirePermission("view_audit_logs"),
  adminAuditLogQueryValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        status,
        action,
        userId,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: limitStr,
        offset: offsetStr,
      } = req.query;

      const startDate = startDateStr
        ? new Date(startDateStr as string)
        : undefined;
      const endDate = endDateStr ? new Date(endDateStr as string) : undefined;
      const limit = limitStr ? parseInt(limitStr as string) : 100;
      const offset = offsetStr ? parseInt(offsetStr as string) : 0;

      const auditLogs = await getAdminAuditLogs({
        userId: userId as string,
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
      console.error(`Error fetching admin audit logs:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
