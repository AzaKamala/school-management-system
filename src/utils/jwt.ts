import jwt from "jsonwebtoken";
import { adminPrisma } from "./tenantContext";
import { v4 as uuidv4 } from "uuid";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "secret";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "5d";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  tenantId?: string;
  roles: string[];
  permissions: string[];
}

interface RefreshTokenPayload {
  tokenId: string;
  userId: string;
  isAdmin: boolean;
  tenantId?: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export async function generateRefreshToken(
  userId: string,
  isAdmin: boolean,
  tenantId?: string
): Promise<string> {
  const tokenId = uuidv4();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 5);

  await adminPrisma.refreshToken.create({
    data: {
      id: tokenId,
      token: tokenId,
      userId,
      adminUser: isAdmin,
      expiresAt,
      revoked: false,
    },
  });

  const refreshTokenPayload: RefreshTokenPayload = {
    tokenId,
    userId,
    isAdmin,
    tenantId,
  };

  return jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET
    ) as AccessTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<any | null> {
  try {
    const decoded = jwt.verify(
      token,
      REFRESH_TOKEN_SECRET
    ) as RefreshTokenPayload;

    const refreshToken = await adminPrisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
    });

    if (
      !refreshToken ||
      refreshToken.revoked ||
      refreshToken.userId !== decoded.userId
    ) {
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      await adminPrisma.refreshToken.update({
        where: { id: decoded.tokenId },
        data: { revoked: true },
      });
      return null;
    }

    return { ...refreshToken, tenantId: decoded.tenantId };
  } catch (error) {
    return null;
  }
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await adminPrisma.refreshToken.update({
    where: { id: tokenId },
    data: { revoked: true },
  });
}

export async function revokeAllUserRefreshTokens(
  userId: string,
  isAdmin: boolean
): Promise<void> {
  await adminPrisma.refreshToken.updateMany({
    where: {
      userId,
      adminUser: isAdmin,
    },
    data: { revoked: true },
  });
}
