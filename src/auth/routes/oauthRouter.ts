import { Router, Request, Response } from "express";
import { handleGoogleCallback } from "../queries/oauthQueries";
import { rateLimitLogin } from "../../common/middlewares/rateLimitMiddleware";
import { publishLoginEvent } from "../../utils/rabbitmq";

const router = Router();

// I added route only for Google OAuth, but you can add more routes for other OAuth providers.

router.get("/google", rateLimitLogin, (req: Request, res: Response): void => {
  const { tenantId } = req.query;

  if (!tenantId) {
    publishLoginEvent({
      email: "unknown",
      action: "login",
      status: "failure",
      ip: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      timestamp: new Date(),
      metadata: {
        method: "oauth",
        provider: "google",
        reason: "missing_tenant_in_redirect",
      },
    });

    res.status(400).json({ error: "Tenant ID is required" });
    return;
  }

  // In a real scenario, you would redirect to Google's OAuth URL with the required parameters.
  // But for this example, we'll redirect to the callback URL directly.
  const redirectUrl = `/auth/oauth/google/callback?tenantId=${tenantId}`;

  res.redirect(redirectUrl);
  return;
});

router.get(
  "/google/callback",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, tenantId } = req.query;

      if (!code) {
        await publishLoginEvent({
          email: "unknown",
          tenantId: (tenantId as string) || undefined,
          action: "login",
          status: "failure",
          ip: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          timestamp: new Date(),
          metadata: {
            method: "oauth",
            provider: "google",
            reason: "missing_auth_code",
          },
        });

        res.status(400).json({ error: "Authorization code is required" });
        return;
      }

      if (!tenantId) {
        await publishLoginEvent({
          email: "unknown",
          action: "login",
          status: "failure",
          ip: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          timestamp: new Date(),
          metadata: {
            method: "oauth",
            provider: "google",
            reason: "missing_tenant_in_callback",
          },
        });

        res.status(400).json({ error: "Tenant ID is required" });
        return;
      }

      const result = await handleGoogleCallback(
        code as string,
        tenantId as string,
        req
      );

      res.status(200).json(result);
      return;
    } catch (error) {
      console.error("OAuth callback error:", error);

      try {
        const { tenantId } = req.query;
        await publishLoginEvent({
          email: "unknown",
          tenantId: (tenantId as string) || undefined,
          action: "login",
          status: "failure",
          ip: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          timestamp: new Date(),
          metadata: {
            method: "oauth",
            provider: "google",
            reason: "server_error",
          },
        });
      } catch (auditError) {
        console.error("Failed to publish OAuth audit log:", auditError);
      }

      res.status(500).json({ error: "Failed to authenticate with Google" });
      return;
    }
  }
);

export default router;
