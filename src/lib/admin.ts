import type { User } from "@supabase/supabase-js";

export type AdminRole = "content_admin" | "super_admin";

const ADMIN_ROLE_VALUES = new Set<AdminRole>(["content_admin", "super_admin"]);

function normalizeRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().toLowerCase();
  return ADMIN_ROLE_VALUES.has(normalizedValue as AdminRole)
    ? (normalizedValue as AdminRole)
    : null;
}

export function getAdminRole(user: User | null | undefined): AdminRole | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const explicitRole =
    normalizeRole(metadata.role) ?? normalizeRole(metadata.admin_role);

  if (explicitRole) {
    return explicitRole;
  }

  if (metadata.is_admin === true) {
    return "super_admin";
  }

  if (import.meta.env.DEV) {
    return "super_admin";
  }

  return null;
}

export function canAccessAdmin(user: User | null | undefined) {
  return Boolean(getAdminRole(user));
}
