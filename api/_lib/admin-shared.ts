import { Account, Client, Databases, ID, Query, Users } from "node-appwrite";

export type AdminConfig = {
  endpoint: string;
  projectId: string;
  databaseId: string;
  profilesCollectionId: string;
  postsCollectionId: string;
  auditCollectionId: string;
  adminEmail: string;
  apiKey: string;
};

export type AdminActor = {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  session: string;
};

export function readAdminConfig(): AdminConfig {
  return {
    endpoint:
      process.env.APPWRITE_ENDPOINT?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT?.trim() ||
      "https://fra.cloud.appwrite.io/v1",
    projectId:
      process.env.APPWRITE_PROJECT_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID?.trim() ||
      "",
    databaseId:
      process.env.APPWRITE_DATABASE_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID?.trim() ||
      "",
    profilesCollectionId:
      process.env.APPWRITE_PROFILES_COLLECTION_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID?.trim() ||
      "profiles",
    postsCollectionId:
      process.env.APPWRITE_POSTS_COLLECTION_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID?.trim() ||
      "posts",
    auditCollectionId:
      process.env.APPWRITE_AUDIT_COLLECTION_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_AUDIT_COLLECTION_ID?.trim() ||
      "admin_audit",
    adminEmail:
      process.env.VAR_ADMIN_EMAIL?.trim().toLowerCase() ||
      process.env.EXPO_PUBLIC_VAR_ADMIN_EMAIL?.trim().toLowerCase() ||
      "",
    apiKey: process.env.APPWRITE_API_KEY?.trim() || "",
  };
}

export function sendJson(
  response: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void },
  statusCode: number,
  payload: Record<string, unknown>,
) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Appwrite-Session");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.end(JSON.stringify(payload));
}

export function handleOptions(request: { method?: string }, response: {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b?: string) => void;
}) {
  if ((request.method ?? "GET") === "OPTIONS") {
    response.statusCode = 204;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Appwrite-Session");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.end("");
    return true;
  }

  return false;
}

export function readSessionHeader(request: { headers?: Record<string, string | string[] | undefined> }) {
  const raw = request.headers?.["x-appwrite-session"];
  return typeof raw === "string" ? raw.trim() : "";
}

export function createSessionClient(config: AdminConfig, session: string) {
  return new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setSession(session);
}

export function createServerClient(config: AdminConfig) {
  return new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
}

export function normalizeDisplayVarId(value: string) {
  const digitsOnly = value.trim().replace(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }

  return `VAR-${digitsOnly.slice(-8).padStart(8, "0")}`;
}

export function isAdminAccount(input: {
  email: string;
  username: string;
  role: string;
  adminEmail: string;
}) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const role = input.role.trim().toLowerCase();

  if (role === "admin") {
    return true;
  }

  if (username === "var") {
    return !input.adminEmail || email === input.adminEmail;
  }

  return Boolean(input.adminEmail) && email === input.adminEmail;
}

export async function requireAdminSession(
  request: { headers?: Record<string, string | string[] | undefined> },
  config: AdminConfig,
) {
  const session = readSessionHeader(request);

  if (!session) {
    throw new Error("MISSING_SESSION");
  }

  if (!config.projectId) {
    throw new Error("MISSING_PROJECT");
  }

  const account = new Account(createSessionClient(config, session));
  const user = await account.get();
  const prefs = (user.prefs ?? {}) as Record<string, unknown>;
  const username =
    typeof prefs.username === "string" ? prefs.username : "";
  const role = typeof prefs.role === "string" ? prefs.role : "member";
  const email = (user.email ?? "").trim().toLowerCase();

  if (!isAdminAccount({ email, username, role, adminEmail: config.adminEmail })) {
    throw new Error("NOT_ADMIN");
  }

  return {
    id: user.$id,
    email,
    name: user.name ?? "",
    username,
    role,
    session,
  } satisfies AdminActor;
}

export function readJsonBody(request: {
  body?: string | Record<string, unknown>;
}) {
  if (!request.body) {
    return {};
  }

  if (typeof request.body === "string") {
    return JSON.parse(request.body) as Record<string, unknown>;
  }

  return request.body as Record<string, unknown>;
}

export async function updateDocumentWithFallback(
  config: AdminConfig,
  collectionId: string,
  documentId: string,
  payloads: Array<Record<string, unknown>>,
) {
  requireServerKey(config);
  const databases = new Databases(createServerClient(config));
  let lastError: unknown = null;

  for (const data of payloads) {
    try {
      return await databases.updateDocument(
        config.databaseId,
        collectionId,
        documentId,
        data,
      );
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("unknown") && message.includes("attribute")) {
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to update document.");
}

export function requireServerKey(config: AdminConfig) {
  if (!config.apiKey) {
    throw new Error("MISSING_API_KEY");
  }
}

export async function findProfileByDisplayVarId(
  config: AdminConfig,
  displayVarId: string,
) {
  requireServerKey(config);

  const normalized = normalizeDisplayVarId(displayVarId);
  if (!normalized || !config.databaseId) {
    return null;
  }

  const databases = new Databases(createServerClient(config));
  const response = await databases.listDocuments(
    config.databaseId,
    config.profilesCollectionId,
    [Query.equal("displayVarId", normalized), Query.limit(1)],
  );

  const document = response.documents[0];
  if (!document) {
    return null;
  }

  return document;
}

export function readBoolField(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true" || value === "1";
  }

  return false;
}

export async function updateProfileVerification(
  config: AdminConfig,
  profileDocumentId: string,
  verified: boolean,
) {
  return updateDocumentWithFallback(
    config,
    config.profilesCollectionId,
    profileDocumentId,
    [{ isVerified: verified }, { isVerified: verified ? "true" : "false" }],
  );
}

export async function updateProfileAccountStatus(
  config: AdminConfig,
  profileDocumentId: string,
  status: "active" | "suspended",
) {
  return updateDocumentWithFallback(
    config,
    config.profilesCollectionId,
    profileDocumentId,
    [{ accountStatus: status }],
  );
}

export async function updatePostVisibility(
  config: AdminConfig,
  postId: string,
  hidden: boolean,
) {
  return updateDocumentWithFallback(config, config.postsCollectionId, postId, [
    { status: hidden ? "hidden" : "published" },
    { isHidden: hidden },
    { isHidden: hidden ? "true" : "false" },
  ]);
}

export async function writeAdminAuditLog(
  config: AdminConfig,
  input: {
    action: string;
    targetId: string;
    admin: AdminActor;
    details?: string;
  },
) {
  if (!config.databaseId || !config.auditCollectionId) {
    return null;
  }

  try {
    requireServerKey(config);
    const databases = new Databases(createServerClient(config));
    return await databases.createDocument(
      config.databaseId,
      config.auditCollectionId,
      ID.unique(),
      {
        action: input.action,
        targetId: input.targetId,
        adminId: input.admin.id,
        adminEmail: input.admin.email,
        details: input.details ?? "",
      },
    );
  } catch {
    return null;
  }
}

export async function listAdminAuditLogs(config: AdminConfig, limit = 40) {
  requireServerKey(config);

  if (!config.databaseId || !config.auditCollectionId) {
    return [];
  }

  const databases = new Databases(createServerClient(config));

  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.auditCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(limit)],
    );

    return response.documents.map((document) => ({
      id: document.$id,
      action:
        typeof document.action === "string" ? document.action : "عملية",
      targetId:
        typeof document.targetId === "string" ? document.targetId : "",
      adminEmail:
        typeof document.adminEmail === "string" ? document.adminEmail : "",
      details: typeof document.details === "string" ? document.details : "",
      createdAt:
        typeof document.$createdAt === "string" ? document.$createdAt : "",
    }));
  } catch {
    return [];
  }
}

export function readAccountStatus(value: unknown) {
  if (typeof value !== "string") {
    return "active";
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "suspended" ? "suspended" : "active";
}

export function readPostHidden(document: Record<string, unknown>) {
  if (readBoolField(document.isHidden)) {
    return true;
  }

  if (typeof document.status === "string") {
    return document.status.trim().toLowerCase() === "hidden";
  }

  return false;
}

export async function syncAccountVerifiedPref(
  config: AdminConfig,
  userId: string,
  verified: boolean,
) {
  requireServerKey(config);
  const users = new Users(createServerClient(config));
  const current = await users.get(userId);
  const prefs = (current.prefs ?? {}) as Record<string, unknown>;

  await users.updatePrefs(userId, {
    prefs: {
      ...prefs,
      isVerified: verified,
    },
  });
}
