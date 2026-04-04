import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

const TOKEN_VERSION = "v1";

type RoomTokenPayload = {
  roomId: string;
  userId: string;
  issuedAt: string;
};

function getSecret() {
  const secret = env.battleSharedSecret.trim();
  if (!secret) {
    throw new Error("battle_shared_secret_not_configured");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createBattleRoomToken(payload: RoomTokenPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(`${TOKEN_VERSION}.${encodedPayload}`);
  return `${TOKEN_VERSION}.${encodedPayload}.${signature}`;
}

export function verifyBattleRoomToken(token: string) {
  const [version, encodedPayload, signature] = token.split(".");
  if (version !== TOKEN_VERSION || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(`${version}.${encodedPayload}`);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as RoomTokenPayload;
    if (!parsed.roomId || !parsed.userId || !parsed.issuedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
