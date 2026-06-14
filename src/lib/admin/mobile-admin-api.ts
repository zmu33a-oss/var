import { IS_WEB_RUNTIME, getAccountBridge } from "../appwrite/appwrite.client";
import { readWebAppwriteSessionSecret } from "../../appshell/appshell.helpers";

export type AdminUserSummary = {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  displayVarId: string;
  varId: string;
  role: "admin" | "member" | string;
  verified: boolean;
  cardTier: "classic" | "gold" | "platinum";
  accountStatus: "active" | "suspended";
  avatarUrl: string;
  createdAt: string;
};

export type AdminPostSummary = {
  id: string;
  title: string;
  content: string;
  varId: string;
  authorId: string;
  createdAt: string;
  hidden: boolean;
};

export type AdminAuditEntry = {
  id: string;
  action: string;
  targetId: string;
  adminEmail: string;
  details: string;
  createdAt: string;
};

type AdminApiPayload = Record<string, unknown>;

class MobileAdminApiError extends Error {
  code: string;

  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.code = code;
  }
}

export function resolveAdminApiBase() {
  const configured =
    process.env.EXPO_PUBLIC_ADMIN_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_APP_URL?.trim() ||
    "";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (IS_WEB_RUNTIME && typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const expoDevPorts = new Set(["8081", "5174", "19006", "8082"]);

    if (expoDevPorts.has(port)) {
      return `${protocol}//${hostname}:3000`;
    }

    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  }

  return "http://localhost:3000";
}

async function readAppwriteSessionSecretAsync() {
  const webSecret = readWebAppwriteSessionSecret();

  if (webSecret) {
    return webSecret;
  }

  try {
    const account = getAccountBridge() as {
      listSessions?: () => Promise<{
        sessions?: Array<{ secret?: string; current?: boolean }>;
      }>;
    };

    if (!account.listSessions) {
      return "";
    }

    const response = await account.listSessions();
    const sessions = response.sessions ?? [];
    const currentSession =
      sessions.find((session) => session.current) ?? sessions[0];

    return currentSession?.secret?.trim() || "";
  } catch {
    return "";
  }
}

async function adminFetch<T extends AdminApiPayload>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await readAppwriteSessionSecretAsync();

  if (!session) {
    throw new MobileAdminApiError(
      "جلسة Appwrite غير متاحة. أعد تسجيل الدخول ثم افتح لوحة الإدارة.",
      "MISSING_SESSION",
    );
  }

  const headers = new Headers(init?.headers ?? {});

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("X-Appwrite-Session", session);

  const response = await fetch(`${resolveAdminApiBase()}${path}`, {
    ...init,
    headers,
  });

  let payload: AdminApiPayload = {};

  try {
    payload = (await response.json()) as AdminApiPayload;
  } catch {
    payload = {};
  }

  if (!response.ok || payload.ok === false) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : `تعذر تنفيذ الطلب (${response.status}).`;
    const code =
      typeof payload.code === "string" ? payload.code : String(response.status);

    throw new MobileAdminApiError(message, code);
  }

  return payload as T;
}

export async function verifyMobileAdminSession() {
  return adminFetch<{ ok: true; admin: { email: string; role: string } }>(
    "/api/admin/me",
  );
}

export async function listMobileAdminUsers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();

  if (options?.search?.trim()) {
    params.set("search", options.search.trim());
  }

  params.set("limit", String(options?.limit ?? 25));
  params.set("offset", String(options?.offset ?? 0));

  const payload = await adminFetch<{
    ok: true;
    users: AdminUserSummary[];
    total: number;
  }>(`/api/admin/users/list?${params.toString()}`);

  return {
    users: payload.users ?? [],
    total: payload.total ?? 0,
  };
}

export async function lookupMobileAdminUser(query: string) {
  const params = new URLSearchParams({
    q: query.trim(),
  });

  const payload = await adminFetch<{
    ok: true;
    user: AdminUserSummary & { postsCount?: number };
  }>(`/api/admin/users/lookup?${params.toString()}`);

  return payload.user;
}

export async function setMobileAdminUserVerification(
  displayVarId: string,
  verified: boolean,
) {
  return adminFetch<{ ok: true; verified: boolean }>(
    "/api/admin/users/verification",
    {
      method: "POST",
      body: JSON.stringify({ displayVarId, verified }),
    },
  );
}

export async function setMobileAdminUserCardTier(
  displayVarId: string,
  cardTier: "classic" | "gold" | "platinum",
) {
  return adminFetch<{ ok: true; cardTier: string }>(
    "/api/admin/users/card-tier",
    {
      method: "POST",
      body: JSON.stringify({ displayVarId, cardTier }),
    },
  );
}

export async function migrateMobileAdminCardTiers() {
  return adminFetch<{ ok: true; migrated: number }>(
    "/api/admin/users/migrate-card-tiers",
    {
      method: "POST",
    },
  );
}

export async function setMobileAdminUserStatus(
  displayVarId: string,
  status: "active" | "suspended",
) {
  return adminFetch<{ ok: true; status: string }>("/api/admin/users/status", {
    method: "POST",
    body: JSON.stringify({ displayVarId, status }),
  });
}

export async function setMobileAdminUserRole(
  displayVarId: string,
  role: "admin" | "member",
) {
  return adminFetch<{ ok: true; role: string }>("/api/admin/users/role", {
    method: "POST",
    body: JSON.stringify({ displayVarId, role }),
  });
}

export async function setMobileAdminUserDisplayVarId(
  currentDisplayVarId: string,
  newDisplayVarId: string,
) {
  return adminFetch<{ ok: true; displayVarId: string }>(
    "/api/admin/users/display-var-id",
    {
      method: "POST",
      body: JSON.stringify({ currentDisplayVarId, newDisplayVarId }),
    },
  );
}

export async function listMobileAdminPosts() {
  const payload = await adminFetch<{ ok: true; posts: AdminPostSummary[] }>(
    "/api/admin/posts/list",
  );

  return payload.posts ?? [];
}

export async function setMobileAdminPostHidden(postId: string, hidden: boolean) {
  return adminFetch<{ ok: true; hidden: boolean }>("/api/admin/posts/hide", {
    method: "POST",
    body: JSON.stringify({ postId, hidden }),
  });
}

export async function deleteMobileAdminPost(postId: string) {
  return adminFetch<{ ok: true; postId: string }>("/api/admin/posts/delete", {
    method: "POST",
    body: JSON.stringify({ postId }),
  });
}

export async function listMobileAdminAuditLogs() {
  const payload = await adminFetch<{ ok: true; logs: AdminAuditEntry[] }>(
    "/api/admin/audit/list",
  );

  return payload.logs ?? [];
}

export function getMobileAdminApiHint(error: unknown) {
  if (!(error instanceof MobileAdminApiError)) {
    return error instanceof Error
      ? error.message
      : "تعذر تنفيذ العملية الإدارية.";
  }

  if (error.code === "MISSING_API_KEY") {
    return "أضف APPWRITE_API_KEY في .env.local وشغّل npm run dev:api على المنفذ 3000.";
  }

  if (error.code === "MISSING_SESSION") {
    return error.message;
  }

  return error.message;
}
