import { getStoredSessionSecret } from "./appwrite-auth";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const session = getStoredSessionSecret();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (session) {
    headers.set("X-Appwrite-Session", session);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    return {
      ok: false,
      error:
        typeof payload.error === "string"
          ? payload.error
          : "تعذر تنفيذ الطلب.",
      status: response.status,
    };
  }

  return { ok: true, data: payload as T };
}

export type HealthPayload = {
  ok: boolean;
  missing: string[];
  projectId: string | null;
  databaseId: string | null;
  profilesCollectionId: string;
  postsCollectionId: string;
  writesEnabled: boolean;
  adminEmailConfigured: boolean;
};

export type LookupUser = {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  displayVarId: string;
  varId: string;
  role: string;
  verified: boolean;
  accountStatus: "active" | "suspended";
  postsCount: number;
};

export type AdminPost = {
  id: string;
  title: string;
  content: string;
  varId: string;
  authorId: string;
  createdAt: string;
  hidden: boolean;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  targetId: string;
  adminEmail: string;
  details: string;
  createdAt: string;
};

export function fetchAdminHealth() {
  return adminFetch<HealthPayload>("/api/admin/health");
}

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
};

export function fetchAdminMe() {
  return adminFetch<{ admin: AdminIdentity }>("/api/admin/me");
}

export function lookupAdminUser(displayVarId: string) {
  const query = new URLSearchParams({ displayVarId });
  return adminFetch<{ user: LookupUser }>(
    `/api/admin/users/lookup?${query.toString()}`,
  );
}

export function setUserVerification(displayVarId: string, verified: boolean) {
  return adminFetch<{ verified: boolean }>("/api/admin/users/verification", {
    method: "POST",
    body: JSON.stringify({ displayVarId, verified }),
  });
}

export function listAdminPosts() {
  return adminFetch<{ posts: AdminPost[] }>("/api/admin/posts/list");
}

export function deleteAdminPost(postId: string) {
  return adminFetch<{ postId: string }>("/api/admin/posts/delete", {
    method: "POST",
    body: JSON.stringify({ postId }),
  });
}

export function setUserAccountStatus(
  displayVarId: string,
  status: "active" | "suspended",
) {
  return adminFetch<{ status: string }>("/api/admin/users/status", {
    method: "POST",
    body: JSON.stringify({ displayVarId, status }),
  });
}

export function setPostHidden(postId: string, hidden: boolean) {
  return adminFetch<{ postId: string; hidden: boolean }>("/api/admin/posts/hide", {
    method: "POST",
    body: JSON.stringify({ postId, hidden }),
  });
}

export function listAdminAuditLogs() {
  return adminFetch<{ logs: AuditLogEntry[]; collectionId: string }>(
    "/api/admin/audit/list",
  );
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  grant_verification: "منح توثيق",
  revoke_verification: "إلغاء توثيق",
  suspend_account: "إيقاف حساب",
  activate_account: "إعادة تفعيل",
  hide_post: "إخفاء منشور",
  unhide_post: "إظهار منشور",
  delete_post: "حذف منشور",
};

export function formatAuditAction(action: string) {
  return AUDIT_ACTION_LABELS[action] || action;
}
