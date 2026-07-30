import "server-only";

import ExcelJS from "exceljs";
import { mapAppStatus } from "@/lib/serializers";
import type { Application, ApplicationStatus } from "@prisma/client";

type AppWithMedia = Application & {
  video?: { media?: { secureUrl: string | null; url: string | null } | null } | null;
};

function videoUrl(app: AppWithMedia) {
  return app.video?.media?.secureUrl || app.video?.media?.url || null;
}

function setLink(
  cell: ExcelJS.Cell,
  url: string | null | undefined,
  label: string,
) {
  if (!url) {
    cell.value = "";
    return;
  }
  cell.value = { text: label, hyperlink: url };
  cell.font = { color: { argb: "FF0563C1" }, underline: true };
}

export async function buildApplicationsWorkbook(apps: AppWithMedia[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BOBO Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Submissions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Age", key: "age", width: 8 },
    { header: "Status", key: "status", width: 12 },
    { header: "TikTok", key: "tiktok", width: 18 },
    { header: "Instagram", key: "instagram", width: 18 },
    { header: "X", key: "x", width: 18 },
    { header: "Facebook", key: "facebook", width: 18 },
    { header: "Entry video", key: "video", width: 36 },
    { header: "Submitted", key: "submitted", width: 22 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle" };

  for (const app of apps) {
    const row = sheet.addRow({
      name: app.fullName,
      email: app.email,
      phone: app.phone,
      age: app.age,
      status: mapAppStatus(app.status as ApplicationStatus),
      submitted: app.createdAt.toISOString(),
    });

    setLink(row.getCell("tiktok"), app.tiktokUrl, "TikTok");
    setLink(row.getCell("instagram"), app.instagramUrl, "Instagram");
    setLink(row.getCell("x"), app.xUrl, "X");
    setLink(row.getCell("facebook"), app.facebookUrl, "Facebook");

    const video = videoUrl(app);
    setLink(
      row.getCell("video"),
      video,
      video ? `${app.fullName} — Entry video` : "",
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
