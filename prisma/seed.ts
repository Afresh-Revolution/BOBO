import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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

  const sections = [
    {
      sectionKey: "hero",
      title: "BOBO",
      subtitle: "Battle Of Baddies On",
      body: "Redefining what a Baddie truly means.",
      ctaLabel: "Start Application",
      ctaHref: "/apply",
      sortOrder: 0,
    },
    {
      sectionKey: "about",
      title: "The Standard",
      subtitle: "A Baddie is built on substance.",
      body: "BOBO is redefining what a Baddie truly means — intelligence, elegance, purpose, class, style, and confidence.",
      sortOrder: 1,
    },
    {
      sectionKey: "timeline",
      title: "The Season",
      subtitle: "Mark the dates.",
      body: "Portal opens August 1. Closes October 31. The show begins December 26.",
      sortOrder: 2,
    },
    {
      sectionKey: "faq",
      title: "FAQ",
      subtitle: "Answers, without the fluff.",
      sortOrder: 3,
    },
    {
      sectionKey: "sponsors",
      title: "Partners",
      subtitle: "Powered by the ecosystem.",
      body: "Applications, voting, and registration live across the CBrilliance network.",
      sortOrder: 4,
    },
  ];

  for (const section of sections) {
    await prisma.websiteContent.upsert({
      where: { sectionKey: section.sectionKey },
      create: section,
      update: {
        title: section.title,
        subtitle: section.subtitle,
        body: "body" in section ? section.body : undefined,
        ctaLabel: "ctaLabel" in section ? section.ctaLabel : undefined,
        ctaHref: "ctaHref" in section ? section.ctaHref : undefined,
        sortOrder: section.sortOrder,
        isPublished: true,
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
