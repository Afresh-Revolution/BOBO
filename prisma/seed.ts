import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { defaultLandingSections } from "../src/lib/cms-defaults";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@boborealities.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "William";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: {
      email,
      fullName: "BOBO Super Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      fullName: "BOBO Super Admin",
    },
  });

  for (const section of defaultLandingSections) {
    const meta = section.meta as Prisma.InputJsonValue;
    await prisma.websiteContent.upsert({
      where: { sectionKey: section.sectionKey },
      create: {
        sectionKey: section.sectionKey,
        title: section.title,
        subtitle: section.subtitle,
        body: "body" in section ? (section.body as string) : null,
        ctaLabel: "ctaLabel" in section ? (section.ctaLabel as string) : null,
        ctaHref: "ctaHref" in section ? (section.ctaHref as string) : null,
        sortOrder: section.sortOrder,
        isPublished: true,
        meta,
      },
      update: {
        title: section.title,
        subtitle: section.subtitle,
        body: "body" in section ? (section.body as string) : null,
        ctaLabel: "ctaLabel" in section ? (section.ctaLabel as string) : null,
        ctaHref: "ctaHref" in section ? (section.ctaHref as string) : null,
        sortOrder: section.sortOrder,
        isPublished: true,
        meta,
      },
    });
  }

  await prisma.seasonWinner.upsert({
    where: { seasonNumber: 1 },
    create: {
      seasonNumber: 1,
      seasonLabel: "Season 1",
      winnerName: "OBIANUJU",
      stateOfOrigin: "Abuja",
      imageUrl: "/winner.png",
      sortOrder: 0,
      isPublished: true,
    },
    update: {
      seasonLabel: "Season 1",
      winnerName: "OBIANUJU",
      stateOfOrigin: "Abuja",
      imageUrl: "/winner.png",
      sortOrder: 0,
      isPublished: true,
      deletedAt: null,
    },
  });

  const defaultPartners = [
    { name: "CBrilliance", href: "https://cbrilliance.io", sortOrder: 0 },
    { name: "Popin", href: "https://popin.club", sortOrder: 1 },
    { name: "CBC Nets", href: "https://cbcnets.com", sortOrder: 2 },
  ];

  for (const partner of defaultPartners) {
    const existing = await prisma.networkPartner.findFirst({
      where: { name: partner.name, deletedAt: null },
    });
    if (!existing) {
      await prisma.networkPartner.create({
        data: {
          name: partner.name,
          href: partner.href,
          sortOrder: partner.sortOrder,
          isPublished: true,
        },
      });
    }
  }

  await prisma.setting.upsert({
    where: { key: "site" },
    create: {
      key: "site",
      value: {
        portalOpen: true,
        registrationFeeCbc: 3,
        registrationApproxNgn: 75000,
      },
    },
    update: {},
  });

  console.log(`Seeded admin ${email} (password from ADMIN_PASSWORD)`);
  console.log("Seeded CMS sections + Season 1 winner + network partners");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
