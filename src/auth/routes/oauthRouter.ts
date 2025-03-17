import { Router, Request, Response } from "express";
import { handleGoogleCallback } from "../queries/oauthQueries";
import { rateLimitLogin } from "../../common/middlewares/rateLimitMiddleware";

const router = Router();

// I added route only for Google OAuth, but you can add more routes for other OAuth providers.

router.get("/google", rateLimitLogin, (req: Request, res: Response): void => {
  const { tenantId } = req.query;

  if (!tenantId) {
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
        res.status(400).json({ error: "Authorization code is required" });
        return;
      }

      if (!tenantId) {
        res.status(400).json({ error: "Tenant ID is required" });
        return;
      }

      const result = await handleGoogleCallback(
        code as string,
        tenantId as string
      );

      res.status(200).json(result);
      return;
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Failed to authenticate with Google" });
      return;
    }
  }
);

export default router;
