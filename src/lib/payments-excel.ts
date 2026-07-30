import "server-only";

import ExcelJS from "exceljs";
import { mapPaymentStatus } from "@/lib/serializers";
import type { Payment, PaymentStatus } from "@prisma/client";

type PaymentRow = Payment & {
  application?: {
    fullName: string;
    email: string;
    phone?: string | null;
    age?: number | null;
    stateOfResidence?: string | null;
  } | null;
};

function receiptUrl(meta: unknown) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const url = (meta as Record<string, unknown>).receiptUrl;
  return typeof url === "string" && url.trim() ? url.trim() : null;
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

export async function buildPaymentsWorkbook(payments: PaymentRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BOBO Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Payments", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Contestant", key: "name", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Age", key: "age", width: 8 },
    { header: "State of residence", key: "stateOfResidence", width: 18 },
    { header: "Amount (CBC)", key: "amountCbc", width: 14 },
    { header: "Amount (NGN approx)", key: "amountNgn", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Reference", key: "reference", width: 28 },
    { header: "Receipt", key: "receipt", width: 36 },
    { header: "Submitted", key: "submitted", width: 22 },
    { header: "Paid at", key: "paidAt", width: 22 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle" };

  for (const payment of payments) {
    const row = sheet.addRow({
      name: payment.application?.fullName ?? "",
      email: payment.application?.email ?? "",
      phone: payment.application?.phone ?? "",
      age: payment.application?.age ?? "",
      stateOfResidence: payment.application?.stateOfResidence ?? "",
      amountCbc: Number(payment.amountCbc),
      amountNgn: payment.amountNgnApprox,
      status: mapPaymentStatus(payment.status as PaymentStatus),
      reference: payment.reference ?? "",
      submitted: payment.createdAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? "",
    });

    const receipt = receiptUrl(payment.meta);
    setLink(
      row.getCell("receipt"),
      receipt,
      receipt ? "View receipt" : "",
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
