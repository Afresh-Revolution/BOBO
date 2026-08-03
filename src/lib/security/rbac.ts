import type { Admin, AdminRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";

export type AdminPermission =
  | "read"
  | "manage_applications"
  | "manage_payments"
  | "manage_cms"
  | "manage_media"
  | "manage_settings"
  | "manage_emails"
  | "manage_admins"
  | "export"
  | "delete";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  VIEWER: ["read"],
  EDITOR: ["read", "manage_cms", "manage_media"],
  ADMIN: [
    "read",
    "manage_applications",
    "manage_payments",
    "manage_cms",
    "manage_media",
    "manage_settings",
    "manage_emails",
    "export",
    "delete",
  ],
  SUPER_ADMIN: [
    "read",
    "manage_applications",
    "manage_payments",
    "manage_cms",
    "manage_media",
    "manage_settings",
    "manage_emails",
    "manage_admins",
    "export",
    "delete",
  ],
};

export function hasPermission(admin: Admin, permission: AdminPermission) {
  if (admin.role === "SUPER_ADMIN") return true;
  return ROLE_PERMISSIONS[admin.role]?.includes(permission) ?? false;
}

export function assertPermission(admin: Admin, permission: AdminPermission) {
  return hasPermission(admin, permission);
}

export function assertRoles(admin: Admin, roles: AdminRole[]) {
  return requireRole(admin, roles);
}

/** Map HTTP method + path heuristics to a permission. */
export function permissionForAdminPath(
  method: string,
  pathname: string,
): AdminPermission {
  const m = method.toUpperCase();
  const isMutating = !["GET", "HEAD", "OPTIONS"].includes(m);

  if (pathname.includes("/admins")) return "manage_admins";
  if (pathname.includes("/export")) return "export";
  if (pathname.includes("/bulk-delete") || pathname.includes("/delete")) {
    return "delete";
  }
  if (pathname.includes("/payments")) {
    return isMutating ? "manage_payments" : "read";
  }
  if (pathname.includes("/applications") || pathname.includes("/contestants")) {
    return isMutating ? "manage_applications" : "read";
  }
  if (
    pathname.includes("/cms") ||
    pathname.includes("/winners") ||
    pathname.includes("/partners") ||
    pathname.includes("/gallery")
  ) {
    return isMutating ? "manage_cms" : "read";
  }
  if (pathname.includes("/media")) {
    return isMutating ? "manage_media" : "read";
  }
  if (pathname.includes("/settings")) {
    return isMutating ? "manage_settings" : "read";
  }
  if (pathname.includes("/emails")) {
    return isMutating ? "manage_emails" : "read";
  }

  return isMutating ? "manage_applications" : "read";
}
