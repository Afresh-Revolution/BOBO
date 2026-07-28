import { prisma } from "@/lib/db";
import { generateMagicToken, hashToken } from "@/lib/auth";

const ACCEPTANCE_TTL_MS = 48 * 60 * 60 * 1000;

export async function createAcceptanceLink(
  applicationId: string,
  expiresAt?: Date,
) {
  const rawToken = generateMagicToken();
  const tokenHash = hashToken(rawToken);
  const expires = expiresAt ?? new Date(Date.now() + ACCEPTANCE_TTL_MS);

  await prisma.magicLink.updateMany({
    where: {
      applicationId,
      type: "ACCEPTANCE",
      usedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const record = await prisma.magicLink.create({
    data: {
      applicationId,
      tokenHash,
      type: "ACCEPTANCE",
      expiresAt: expires,
    },
  });

  return { rawToken, record };
}
