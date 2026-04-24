import { supabase } from "../pages/supabase";
import type { AdminRole } from "./admin";
import type {
  AdminAuditLog,
  AdminReport,
  AdminReportStatus,
} from "./adminStore";

export type VerificationBadgeVariant = "yellow" | "blue";

export type VerifiedUserRecord = {
  userId: string;
  badge: VerificationBadgeVariant;
  updatedAt: string;
  updatedBy: string;
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  verified: boolean;
  verificationBadge: VerificationBadgeVariant | null;
};

export type AdminGroupRow = {
  id: string;
  name: string;
  is_private: boolean;
  created_by: string | null;
  memberCount: number;
};

export type AdminVideoRow = {
  id: number;
  video_url: string;
  caption: string;
};

export type AdminDashboardPayload = {
  users: AdminUserRow[];
  groups: AdminGroupRow[];
  videos: AdminVideoRow[];
  reports: AdminReport[];
  auditLogs: AdminAuditLog[];
  verifiedUsers: VerifiedUserRecord[];
};

export type AdminSessionPayload = {
  role: AdminRole;
  email: string | null;
  userId: string;
};

export class AdminApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

export const ADMIN_API_BASE = (
  import.meta.env.VITE_ADMIN_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:5000/api/admin" : "/api/admin")
).replace(/\/+$/, "");

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

async function adminRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...init,
    headers,
  });

  const responseType = response.headers.get("content-type") || "";
  const body = responseType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      (typeof body === "object" && body && "message" in body
        ? String(body.message)
        : typeof body === "string" && body
          ? body
          : "تعذر تنفيذ طلب الأدمن") || "تعذر تنفيذ طلب الأدمن";
    const code =
      typeof body === "object" && body && "error" in body
        ? String(body.error)
        : undefined;

    throw new AdminApiError(message, response.status, code);
  }

  return body as T;
}

export function isAdminApiError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError;
}

export function shouldFallbackAdminApi(error: unknown) {
  if (!isAdminApiError(error)) return true;

  return error.status !== 401 && error.status !== 403;
}

export async function fetchAdminSession() {
  return adminRequest<AdminSessionPayload>("/session");
}

export async function fetchAdminDashboard() {
  return adminRequest<AdminDashboardPayload>("/dashboard");
}

export async function fetchPublicVerifiedUsers() {
  try {
    const result = await adminRequest<{ verifiedUsers: VerifiedUserRecord[] }>(
      "/public/verification",
    );

    return result.verifiedUsers;
  } catch {
    const { data, error } = await supabase
      .from("user_verifications")
      .select("user_id, badge, updated_at, updated_by")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => ({
      userId: entry.user_id,
      badge: (entry.badge === "blue"
        ? "blue"
        : "yellow") as VerificationBadgeVariant,
      updatedAt: entry.updated_at,
      updatedBy: entry.updated_by,
    }));
  }
}

export async function deleteAdminGroup(groupId: string) {
  return adminRequest<{ success: true; deletedGroupId: string }>(
    `/groups/${groupId}`,
    {
      method: "DELETE",
    },
  );
}

export async function deleteAdminVideo(videoId: number) {
  return adminRequest<{ success: true; deletedVideoId: number }>(
    `/videos/${videoId}`,
    {
      method: "DELETE",
    },
  );
}

export async function loadAdminReportsApi() {
  return adminRequest<AdminReport[]>("/reports");
}

export async function createAdminReportApi(
  input: Omit<AdminReport, "id" | "status" | "createdAt"> & {
    status?: AdminReportStatus;
  },
) {
  return adminRequest<AdminReport>("/reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminReportStatusApi(
  reportId: string,
  status: AdminReportStatus,
) {
  const result = await adminRequest<{
    reports: AdminReport[];
  }>(`/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return result.reports;
}

export async function loadAdminAuditLogsApi() {
  return adminRequest<AdminAuditLog[]>("/audit");
}

export async function appendAdminAuditLogApi(
  input: Omit<AdminAuditLog, "id" | "createdAt">,
) {
  return adminRequest<AdminAuditLog>("/audit", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminUserVerification(
  userId: string,
  verified: boolean,
  badge?: VerificationBadgeVariant,
) {
  return adminRequest<{
    verified: boolean;
    verification: VerifiedUserRecord | null;
    verifiedUsers: VerifiedUserRecord[];
  }>(`/users/${userId}/verification`, {
    method: "PATCH",
    body: JSON.stringify({ verified, badge }),
  });
}
