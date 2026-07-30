import type { Application, ApplicationStatus, Payment, PaymentStatus } from "@prisma/client";

export function mapAppStatus(status: ApplicationStatus) {
  switch (status) {
    case "PENDING":
    case "UNDER_REVIEW":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "REGISTERED":
      return "registered";
    case "EXPIRED":
      return "rejected";
    default:
      return "submitted";
  }
}

export function mapPaymentStatus(status: PaymentStatus) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "PENDING":
      return "pending";
    case "FAILED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

export function serializeApplication(
  app: Application & {
    video?: { media?: { secureUrl: string } | null; promptChoice?: string } | null;
    media?: { kind: string; secureUrl: string }[];
  },
) {
  const birth = app.media?.find((m) => m.kind === "BIRTH_CERTIFICATE");
  return {
    id: app.id,
    fullName: app.fullName,
    email: app.email,
    phone: app.phone,
    age: app.age,
    status: mapAppStatus(app.status),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    videoUrl: app.video?.media?.secureUrl,
    birthCertUrl: birth?.secureUrl,
    healthInfo: [app.historyOfAilments, app.currentHealthChallenge].filter(Boolean).join(" · "),
    reason: app.rejectionReason ?? undefined,
    bloodGroup: app.bloodGroup,
    genotype: app.genotype,
    nin: app.nin,
    motherMaidenName: app.motherMaidenName,
    tiktokUrl: app.tiktokUrl ?? undefined,
    instagramUrl: app.instagramUrl ?? undefined,
    xUrl: app.xUrl ?? undefined,
    facebookUrl: app.facebookUrl ?? undefined,
    promptChoice: app.video?.promptChoice,
  };
}

export function serializePayment(
  payment: Payment & { application?: { fullName: string; email: string } },
) {
  return {
    id: payment.id,
    applicationId: payment.applicationId,
    contestantName: payment.application?.fullName ?? "—",
    email: payment.application?.email ?? "—",
    amount: payment.amountNgnApprox,
    currency: "NGN",
    status: mapPaymentStatus(payment.status),
    reference: payment.reference ?? undefined,
    createdAt: payment.createdAt.toISOString(),
    amountCbc: Number(payment.amountCbc),
  };
}
