import { getTenantPrismaClient } from "../../utils/tenantContext";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { getTenantById } from "../../admin/queries/tenantQueries";
import { v4 as uuidv4 } from "uuid";
import { publishLoginEvent } from "../../utils/rabbitmq";
import { Request } from "express";

// This is a mock version of using OAuth with Google. In a real scenario, I would be using a library like passport.js to handle the OAuth.
// This is just a simple version of what that would look like.

interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export async function handleGoogleCallback(
  code: string,
  tenantId?: string,
  req?: Request
) {
  try {
    const profile: GoogleProfile = {
      sub: "google-id-123",
      email: "user@example.com",
      name: "Example User",
      given_name: "Example",
      family_name: "User",
      picture: "https://example.com/picture.jpg",
    };

    if (!tenantId) {
      if (req) {
        await publishLoginEvent({
          email: profile.email,
          action: "login",
          status: "failure",
          ip: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          timestamp: new Date(),
          metadata: {
            method: "oauth",
            provider: "google",
            reason: "missing_tenant",
          },
        });
      }
      throw new Error("Tenant ID is required for OAuth login");
    }

    const tenant = await getTenantById(tenantId);

    if (!tenant || !tenant.active) {
      if (req) {
        await publishLoginEvent({
          email: profile.email,
          tenantId,
          action: "login",
          status: "failure",
          ip: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          timestamp: new Date(),
          metadata: {
            method: "oauth",
            provider: "google",
            reason: "invalid_tenant",
          },
        });
      }
      throw new Error("Invalid tenant");
    }

    const tenantPrisma = await getTenantPrismaClient(tenantId);

    let oauth = await tenantPrisma.oAuth.findUnique({
      where: {
        providerId: profile.sub,
      },
      include: {
        user: true,
      },
    });

    let user;

    if (oauth) {
      user = oauth.user;
    } else {
      user = await tenantPrisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        oauth = await tenantPrisma.oAuth.create({
          data: {
            provider: "google",
            providerId: profile.sub,
            userId: user.id,
          },
          include: {
            user: true,
          },
        });
      } else {
        user = await tenantPrisma.user.create({
          data: {
            id: uuidv4(),
            email: profile.email,
            firstName: profile.given_name,
            lastName: profile.family_name,
            active: true,
            oauthAccounts: {
              create: {
                provider: "google",
                providerId: profile.sub,
              },
            },
          },
        });

        const studentRole = await tenantPrisma.tenantRole.findFirst({
          where: { name: "STUDENT" },
        });

        if (studentRole) {
          await tenantPrisma.userRole.create({
            data: {
              userId: user.id,
              tenantRoleId: studentRole.id,
            },
          });
        }
      }
    }

    const userRoles = await tenantPrisma.userRole.findMany({
      where: { userId: user.id },
      include: { tenantRole: true },
    });

    const roleIds = userRoles.map((ur) => ur.tenantRoleId);
    const roleNames = userRoles.map((ur) => ur.tenantRole.name);

    const rolePermissions = await tenantPrisma.tenantRolePermission.findMany({
      where: {
        tenantRoleId: { in: roleIds },
      },
      include: { permission: true },
    });

    const permissions = rolePermissions.map((rp) => rp.permission.name);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isAdmin: false,
      tenantId,
      roles: roleNames,
      permissions,
    });

    const refreshToken = await generateRefreshToken(user.id, false, tenantId);

    if (req) {
      await publishLoginEvent({
        userId: user.id,
        email: user.email,
        tenantId,
        action: "login",
        status: "success",
        ip: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        timestamp: new Date(),
        metadata: {
          method: "oauth",
          provider: "google",
        },
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: false,
        tenantId,
      },
    };
  } catch (error) {
    console.error("Google OAuth error:", error);
    throw error;
  }
}
