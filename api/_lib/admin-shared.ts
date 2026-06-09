import {
  Account,
  AppwriteException,
  Client,
  Databases,
  ID,
  Query,
  Users,
} from "node-appwrite";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type AdminConfig = {
  endpoint: string;
  projectId: string;
  databaseId: string;
  profilesCollectionId: string;
  postsCollectionId: string;
  auditCollectionId: string;
  adminKeysCollectionId: string;
  appSettingsCollectionId: string;
  reportsCollectionId: string;
  socialInteractionsCollectionId: string;
  commentsCollectionId: string;
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

let localEnvHydrated = false;

function hydrateLocalEnv() {
  if (localEnvHydrated) {
    return;
  }

  localEnvHydrated = true;

  if (process.env.APPWRITE_API_KEY?.trim()) {
    return;
  }

  const root = process.cwd();

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(root, fileName);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export function readAdminConfig(): AdminConfig {
  hydrateLocalEnv();

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
    adminKeysCollectionId:
      process.env.APPWRITE_ADMIN_KEYS_COLLECTION_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_ADMIN_KEYS_COLLECTION_ID?.trim() ||
      "admin_keys",
    appSettingsCollectionId:
      process.env.APPWRITE_APP_SETTINGS_COLLECTION_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_APP_SETTINGS_COLLECTION_ID?.trim() ||
      "app_settings",
    reportsCollectionId:
      process.env.APPWRITE_REPORTS_COLLECTION_ID?.trim() ||
      process.env.EXPO_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID?.trim() ||
      "reports",
  socialInteractionsCollectionId:
    process.env.APPWRITE_SOCIAL_INTERACTIONS_COLLECTION_ID?.trim() ||
    process.env.EXPO_PUBLIC_APPWRITE_SOCIAL_INTERACTIONS_COLLECTION_ID?.trim() ||
    "",
  commentsCollectionId:
    process.env.APPWRITE_COMMENTS_COLLECTION_ID?.trim() ||
    process.env.EXPO_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID?.trim() ||
    "",
  adminEmail:
      process.env.VAR_ADMIN_EMAIL?.trim().toLowerCase() ||
      process.env.EXPO_PUBLIC_VAR_ADMIN_EMAIL?.trim().toLowerCase() ||
      "",
    apiKey: process.env.APPWRITE_API_KEY?.trim() || "",
  };
}

export type AdminCollectionHealth = {
  key: string;
  label: string;
  collectionId: string;
  ok: boolean;
  total: number;
  error: string;
};

export async function readAdminHealthSnapshot(config: AdminConfig) {
  const missing: string[] = [];

  if (!config.projectId) {
    missing.push("projectId");
  }

  if (!config.databaseId) {
    missing.push("databaseId");
  }

  if (!config.profilesCollectionId) {
    missing.push("profilesCollectionId");
  }

  if (!config.apiKey) {
    missing.push("apiKey");
  }

  const probes = [
    {
      key: "profiles",
      label: "profiles",
      collectionId: config.profilesCollectionId,
    },
    {
      key: "posts",
      label: "posts",
      collectionId: config.postsCollectionId,
    },
    {
      key: "reports",
      label: "reports",
      collectionId: config.reportsCollectionId,
    },
    {
      key: "audit",
      label: "admin_audit",
      collectionId: config.auditCollectionId,
    },
    {
      key: "admin_keys",
      label: "admin_keys",
      collectionId: config.adminKeysCollectionId,
    },
    {
      key: "app_settings",
      label: "app_settings",
      collectionId: config.appSettingsCollectionId,
    },
  ];

  const collections: AdminCollectionHealth[] = [];

  if (!config.apiKey || !config.databaseId) {
    for (const probe of probes) {
      collections.push({
        key: probe.key,
        label: probe.label,
        collectionId: probe.collectionId || "",
        ok: false,
        total: 0,
        error: missing.includes("apiKey") ? "MISSING_API_KEY" : "MISSING_DATABASE",
      });
    }

    return {
      ok: false,
      writesEnabled: false,
      missing,
      collections,
    };
  }

  const databases = new Databases(createServerClient(config));

  for (const probe of probes) {
    if (!probe.collectionId) {
      collections.push({
        key: probe.key,
        label: probe.label,
        collectionId: "",
        ok: false,
        total: 0,
        error: "MISSING_COLLECTION_ID",
      });
      continue;
    }

    try {
      const response = await databases.listDocuments(
        config.databaseId,
        probe.collectionId,
        [Query.limit(1)],
      );

      collections.push({
        key: probe.key,
        label: probe.label,
        collectionId: probe.collectionId,
        ok: true,
        total: response.total,
        error: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      collections.push({
        key: probe.key,
        label: probe.label,
        collectionId: probe.collectionId,
        ok: false,
        total: 0,
        error: message.toLowerCase().includes("collection")
          ? "COLLECTION_NOT_FOUND"
          : "READ_FAILED",
      });
    }
  }

  const criticalOk = collections
    .filter((item) => item.key === "profiles" || item.key === "posts")
    .every((item) => item.ok);

  return {
    ok: missing.length === 0 && criticalOk,
    writesEnabled: missing.length === 0,
    missing,
    collections,
  };
}

export function sendJson(
  response: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (b: string) => void;
  },
  statusCode: number,
  payload: Record<string, unknown>,
) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Appwrite-Session, X-Appwrite-JWT",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.end(JSON.stringify(payload));
}

export function handleOptions(
  request: { method?: string },
  response: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (b?: string) => void;
  },
) {
  if ((request.method ?? "GET") === "OPTIONS") {
    response.statusCode = 204;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, X-Appwrite-Session, X-Appwrite-JWT",
    );
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.end("");
    return true;
  }

  return false;
}

export function readSessionHeader(request: {
  headers?: Record<string, string | string[] | undefined>;
}) {
  const raw = request.headers?.["x-appwrite-session"];
  return typeof raw === "string" ? raw.trim() : "";
}

export function readJwtHeader(request: {
  headers?: Record<string, string | string[] | undefined>;
}) {
  const raw = request.headers?.["x-appwrite-jwt"];
  return typeof raw === "string" ? raw.trim() : "";
}

export type AdminAuth = {
  type: "jwt" | "session";
  token: string;
};

export function readAuthHeader(request: {
  headers?: Record<string, string | string[] | undefined>;
}): AdminAuth | null {
  const jwt = readJwtHeader(request);
  if (jwt) {
    return { type: "jwt", token: jwt };
  }

  const session = readSessionHeader(request);
  if (session) {
    return { type: "session", token: session };
  }

  return null;
}

export function createSessionClient(config: AdminConfig, session: string) {
  return new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setSession(session);
}

export function createAuthClient(config: AdminConfig, auth: AdminAuth) {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);

  if (auth.type === "jwt") {
    return client.setJWT(auth.token);
  }

  return client.setSession(auth.token);
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
  const auth = readAuthHeader(request);

  if (!auth) {
    throw new Error("MISSING_SESSION");
  }

  if (!config.projectId) {
    throw new Error("MISSING_PROJECT");
  }

  const account = new Account(createAuthClient(config, auth));
  const user = await account.get();
  const prefs = (user.prefs ?? {}) as Record<string, unknown>;
  const username = typeof prefs.username === "string" ? prefs.username : "";
  const role = typeof prefs.role === "string" ? prefs.role : "member";
  const email = (user.email ?? "").trim().toLowerCase();

  if (
    !isAdminAccount({ email, username, role, adminEmail: config.adminEmail })
  ) {
    throw new Error("NOT_ADMIN");
  }

  return {
    id: user.$id,
    email,
    name: user.name ?? "",
    username,
    role,
    session: auth.token,
  } satisfies AdminActor;
}

type AppwriteJwt = {
  jwt?: string;
};

async function readAppwriteResponse<T extends Record<string, unknown>>(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    type?: string;
  };

  if (!response.ok) {
    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : fallbackMessage;
    const error = new Error(message);
    (error as Error & { type?: string }).type = payload.type;
    throw error;
  }

  return payload;
}

export async function createEmailSession(
  config: AdminConfig,
  email: string,
  password: string,
) {
  if (!config.projectId) {
    throw new Error("MISSING_PROJECT");
  }

  const account = new Account(
    new Client().setEndpoint(config.endpoint).setProject(config.projectId),
  );

  try {
    return await account.createEmailPasswordSession(email, password);
  } catch (error) {
    if (error instanceof AppwriteException) {
      const mapped = new Error(error.message);
      (mapped as Error & { type?: string }).type = error.type;
      throw mapped;
    }

    throw error;
  }
}

export async function createAdminJwtForUser(
  config: AdminConfig,
  userId: string,
  sessionId: string,
) {
  requireServerKey(config);

  const users = new Users(createServerClient(config));

  try {
    const result = await users.createJWT(userId, sessionId);
    const jwt = typeof result.jwt === "string" ? result.jwt.trim() : "";

    if (!jwt) {
      throw new Error("MISSING_JWT");
    }

    return jwt;
  } catch (error) {
    if (error instanceof AppwriteException) {
      const mapped = new Error(error.message);
      (mapped as Error & { type?: string }).type = error.type;
      throw mapped;
    }

    throw error;
  }
}

export async function createJwtForSession(
  config: AdminConfig,
  sessionSecret: string,
) {
  if (!config.projectId) {
    throw new Error("MISSING_PROJECT");
  }

  const response = await fetch(`${config.endpoint}/account/jwt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": config.projectId,
      "X-Appwrite-Session": sessionSecret,
    },
  });

  const payload = await readAppwriteResponse<AppwriteJwt>(
    response,
    "تعذر إنشاء رمز الدخول.",
  );
  const jwt = typeof payload.jwt === "string" ? payload.jwt.trim() : "";

  if (!jwt) {
    throw new Error("MISSING_JWT");
  }

  return jwt;
}

export function mapLoginError(error: unknown) {
  const type =
    error instanceof Error
      ? (error as Error & { type?: string }).type
      : undefined;
  const message = error instanceof Error ? error.message : "UNKNOWN";

  if (
    type === "user_invalid_credentials" ||
    message.includes("Invalid credentials")
  ) {
    return {
      status: 401,
      code: "INVALID_CREDENTIALS",
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  if (message === "NOT_ADMIN") {
    return {
      status: 403,
      code: "NOT_ADMIN",
      error: "هذا الحساب ليس لديه صلاحية أدمن.",
    };
  }

  if (message === "MISSING_PROJECT") {
    return {
      status: 500,
      code: "MISSING_PROJECT",
      error: "إعدادات Appwrite ناقصة على السيرفر.",
    };
  }

  if (message === "INVALID_BODY") {
    return {
      status: 400,
      code: "INVALID_BODY",
      error: "تعذر قراءة بيانات الطلب.",
    };
  }

  if (message === "MISSING_SESSION_SECRET") {
    return {
      status: 500,
      code: "MISSING_SESSION_SECRET",
      error: "Appwrite لم يُرجع secret للجلسة.",
    };
  }

  if (message === "MISSING_JWT") {
    return {
      status: 500,
      code: "MISSING_JWT",
      error: "تعذر إنشاء رمز الدخول.",
    };
  }

  if (message === "MISSING_API_KEY") {
    return {
      status: 500,
      code: "MISSING_API_KEY",
      error: "APPWRITE_API_KEY غير موجود في إعدادات السيرفر.",
    };
  }

  if (message === "MISSING_SESSION") {
    return {
      status: 500,
      code: "MISSING_SESSION",
      error: "تعذر إنشاء جلسة Appwrite.",
    };
  }

  if (type === "user_password_mismatch" || type === "user_not_found") {
    return {
      status: 401,
      code: "INVALID_CREDENTIALS",
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  return {
    status: 500,
    code: "LOGIN_FAILED",
    error: "تعذر تسجيل الدخول. حاول مرة أخرى.",
  };
}

export function readJsonBody(request: {
  body?: string | Record<string, unknown>;
}) {
  try {
    if (!request.body) {
      return {};
    }

    if (typeof request.body === "string") {
      const trimmed = request.body.trim();
      if (!trimmed) {
        return {};
      }

      return JSON.parse(trimmed) as Record<string, unknown>;
    }

    return request.body as Record<string, unknown>;
  } catch {
    throw new Error("INVALID_BODY");
  }
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
      const message = error instanceof Error ? error.message.toLowerCase() : "";
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

/**
 * بحث ذكي يجرّب عدّة استراتيجيات بالترتيب:
 *   1) displayVarId مطابق تماماً (الصيغة القياسية VAR-XXXXXXXX)
 *   2) varId مطابق تماماً (لو الـ admin أدخل varId كامل)
 *   3) username بدون @ (لو الإدخال يبدأ بـ @ أو بدون شرطة)
 *   4) document ID مباشرة (Appwrite User ID)
 *   5) search على displayName (fuzzy)
 *   6) search على username (fuzzy)
 * يُرجع أول مطابقة يجدها، أو null.
 */
export async function findProfileSmart(
  config: AdminConfig,
  rawQuery: string,
): Promise<Record<string, unknown> | null> {
  requireServerKey(config);

  const trimmed = rawQuery.trim();
  if (!trimmed || !config.databaseId) {
    return null;
  }

  const databases = new Databases(createServerClient(config));

  const tryQuery = async (
    queries: string[],
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.profilesCollectionId,
        [...queries, Query.limit(1)],
      );
      const document = response.documents[0];
      return document ? (document as unknown as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  // 1) Display VAR (VAR-XXXXXXXX)
  const normalizedDisplay = normalizeDisplayVarId(trimmed);
  if (normalizedDisplay) {
    const byDisplay = await tryQuery([
      Query.equal("displayVarId", normalizedDisplay),
    ]);
    if (byDisplay) return byDisplay;
  }

  // 2) varId مطابق (مثل VAR-someRandomId)
  const upperTrimmed = trimmed.toUpperCase();
  if (upperTrimmed.startsWith("VAR-")) {
    const byVarIdExact = await tryQuery([Query.equal("varId", upperTrimmed)]);
    if (byVarIdExact) return byVarIdExact;

    // أحياناً varId مخزَّن lowercase
    const byVarIdLower = await tryQuery([
      Query.equal("varId", trimmed.toLowerCase()),
    ]);
    if (byVarIdLower) return byVarIdLower;
  }

  // 3) username (بدون @، بحروف صغيرة)
  const usernameCandidate = trimmed.replace(/^@+/, "").toLowerCase();
  if (usernameCandidate && /^[a-z0-9._]+$/.test(usernameCandidate)) {
    const byUsername = await tryQuery([
      Query.equal("username", usernameCandidate),
    ]);
    if (byUsername) return byUsername;
  }

  // 4) جلب الـ document مباشرة بـ ID (لو المستخدم لصق Appwrite User ID)
  if (/^[a-zA-Z0-9_-]{8,}$/.test(trimmed)) {
    try {
      const document = await databases.getDocument(
        config.databaseId,
        config.profilesCollectionId,
        trimmed,
      );
      return document as unknown as Record<string, unknown>;
    } catch {
      // ignore — ليست document ID صالحة
    }
  }

  // 5) fuzzy search على displayName (يتطلب fulltext index)
  if (trimmed.length >= 2) {
    const byDisplayName = await tryQuery([
      Query.search("displayName", trimmed),
    ]);
    if (byDisplayName) return byDisplayName;
  }

  // 6) fuzzy search على username
  if (usernameCandidate.length >= 2) {
    const byUsernameSearch = await tryQuery([
      Query.search("username", usernameCandidate),
    ]);
    if (byUsernameSearch) return byUsernameSearch;
  }

  return null;
}

/**
 * يُرجع قائمة المستخدمين مع pagination و بحث اختياري.
 * يُستخدم في صفحة Users لعرض جدول كامل.
 */
export async function listAdminProfiles(
  config: AdminConfig,
  options: { search?: string; limit?: number; offset?: number } = {},
): Promise<{
  profiles: Array<Record<string, unknown>>;
  total: number;
}> {
  requireServerKey(config);

  if (!config.databaseId) {
    return { profiles: [], total: 0 };
  }

  const databases = new Databases(createServerClient(config));
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const queries: string[] = [
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ];

  const search = options.search?.trim();
  if (search) {
    // نطبّق نفس استراتيجية البحث الذكي بطريقة OR-friendly عبر تجارب متتابعة.
    // أولاً نجرّب match مباشر، ثم fallback لـ fuzzy search.
    const normalizedDisplay = normalizeDisplayVarId(search);

    // مجموعة محاولات مرتبة حسب الأولوية
    const attempts: string[][] = [];

    if (normalizedDisplay) {
      attempts.push([
        Query.equal("displayVarId", normalizedDisplay),
        Query.limit(limit),
        Query.offset(offset),
      ]);
    }

    if (search.toUpperCase().startsWith("VAR-")) {
      attempts.push([
        Query.equal("varId", search.toUpperCase()),
        Query.limit(limit),
        Query.offset(offset),
      ]);
    }

    const usernameCandidate = search.replace(/^@+/, "").toLowerCase();
    if (usernameCandidate && /^[a-z0-9._]+$/.test(usernameCandidate)) {
      attempts.push([
        Query.equal("username", usernameCandidate),
        Query.limit(limit),
        Query.offset(offset),
      ]);
    }

    // fuzzy
    if (search.length >= 2) {
      attempts.push([
        Query.search("displayName", search),
        Query.limit(limit),
        Query.offset(offset),
      ]);
      attempts.push([
        Query.search("username", usernameCandidate || search),
        Query.limit(limit),
        Query.offset(offset),
      ]);
    }

    for (const attemptQueries of attempts) {
      try {
        const response = await databases.listDocuments(
          config.databaseId,
          config.profilesCollectionId,
          attemptQueries,
        );
        if (response.documents.length > 0) {
          return {
            profiles: response.documents.map(
              (d) => d as unknown as Record<string, unknown>,
            ),
            total: response.total,
          };
        }
      } catch {
        // جرّب المحاولة التالية
      }
    }

    return { profiles: [], total: 0 };
  }

  // بدون بحث — قائمة عادية مرتّبة بالأحدث
  const response = await databases.listDocuments(
    config.databaseId,
    config.profilesCollectionId,
    queries,
  );

  return {
    profiles: response.documents.map(
      (d) => d as unknown as Record<string, unknown>,
    ),
    total: response.total,
  };
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

export type AdminMembershipCardTier = "classic" | "gold" | "platinum";

export function normalizeAdminCardTier(
  value: unknown,
): AdminMembershipCardTier | null {
  if (value === "classic" || value === "gold" || value === "platinum") {
    return value;
  }

  return null;
}

export function readCardTierField(value: unknown): AdminMembershipCardTier {
  return normalizeAdminCardTier(value) ?? "classic";
}

function readProfileStringField(profile: Record<string, unknown>, key: string) {
  const value = profile[key];
  return typeof value === "string" ? value.trim() : "";
}

export function withRequiredProfileFields(
  profile: Record<string, unknown>,
  patch: Record<string, unknown>,
) {
  const role = readProfileStringField(profile, "role") || "member";
  const username = readProfileStringField(profile, "username");
  const admin =
    readProfileStringField(profile, "admin") ||
    (role === "admin" ? "VAR" : "MEMBER");

  return {
    role,
    admin,
    ...(username ? { username } : {}),
    ...patch,
  };
}

function resolveProfileDocumentId(profile: Record<string, unknown>) {
  const documentId = readProfileStringField(profile, "$id");

  if (!documentId) {
    throw new Error("INVALID_PROFILE");
  }

  return documentId;
}

export async function updateProfileCardTier(
  config: AdminConfig,
  profile: Record<string, unknown>,
  cardTier: AdminMembershipCardTier,
) {
  const payload = withRequiredProfileFields(profile, { cardTier });

  return updateDocumentWithFallback(
    config,
    config.profilesCollectionId,
    resolveProfileDocumentId(profile),
    [payload, { ...payload, cardTier: String(cardTier) }],
  );
}

export async function syncAccountCardTierPref(
  config: AdminConfig,
  userId: string,
  cardTier: AdminMembershipCardTier,
) {
  requireServerKey(config);
  const users = new Users(createServerClient(config));
  const current = await users.get(userId);
  const prefs = (current.prefs ?? {}) as Record<string, unknown>;

  await users.updatePrefs(userId, {
    prefs: {
      ...prefs,
      cardTier,
    },
  });
}

export async function migrateMissingCardTiersToClassic(config: AdminConfig) {
  requireServerKey(config);
  const databases = new Databases(createServerClient(config));
  let offset = 0;
  let migrated = 0;
  const limit = 100;

  while (true) {
    const response = await databases.listDocuments(
      config.databaseId,
      config.profilesCollectionId,
      [Query.limit(limit), Query.offset(offset)],
    );

    for (const document of response.documents) {
      const profile = document as unknown as Record<string, unknown>;
      const existingTier = normalizeAdminCardTier(profile.cardTier);

      if (existingTier) {
        continue;
      }

      const profileDocumentId =
        typeof profile.$id === "string" ? profile.$id : "";
      const userId =
        typeof profile.userId === "string" ? profile.userId : profileDocumentId;

      if (!profileDocumentId) {
        continue;
      }

      await updateProfileCardTier(config, profile, "classic");

      if (userId) {
        try {
          await syncAccountCardTierPref(config, userId, "classic");
        } catch {
          // optional prefs sync
        }
      }

      migrated += 1;
    }

    offset += response.documents.length;

    if (response.documents.length < limit) {
      break;
    }
  }

  return migrated;
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
      action: typeof document.action === "string" ? document.action : "عملية",
      targetId: typeof document.targetId === "string" ? document.targetId : "",
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

export async function updateProfileRole(
  config: AdminConfig,
  profileDocumentId: string,
  role: "admin" | "member",
) {
  return updateDocumentWithFallback(
    config,
    config.profilesCollectionId,
    profileDocumentId,
    [{ role }],
  );
}

export async function syncAccountRolePref(
  config: AdminConfig,
  userId: string,
  role: "admin" | "member",
) {
  requireServerKey(config);
  const users = new Users(createServerClient(config));
  const current = await users.get(userId);
  const prefs = (current.prefs ?? {}) as Record<string, unknown>;

  await users.updatePrefs(userId, {
    prefs: {
      ...prefs,
      role,
      adminLabel: role === "admin" ? "VAR" : "",
    },
  });
}

export async function deleteProfileAndUser(
  config: AdminConfig,
  profile: Record<string, unknown>,
  adminId: string,
) {
  requireServerKey(config);

  const profileId = typeof profile.$id === "string" ? profile.$id.trim() : "";
  const userId =
    typeof profile.userId === "string" && profile.userId.trim()
      ? profile.userId.trim()
      : profileId;

  if (!profileId || !userId) {
    throw new Error("INVALID_PROFILE");
  }

  if (userId === adminId) {
    throw new Error("CANNOT_DELETE_SELF");
  }

  const databases = new Databases(createServerClient(config));
  const users = new Users(createServerClient(config));

  await databases.deleteDocument(
    config.databaseId,
    config.profilesCollectionId,
    profileId,
  );

  try {
    await users.delete(userId);
  } catch {
    // profile already removed; user cleanup is best-effort
  }
}

function readPrefString(prefs: Record<string, unknown>, key: string) {
  const value = prefs[key];
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

export function mapAdminUserDetails(
  account: Record<string, unknown>,
  profile: Record<string, unknown>,
) {
  const prefs =
    account.prefs && typeof account.prefs === "object"
      ? (account.prefs as Record<string, unknown>)
      : {};

  const avatarUrl =
    readPrefString(prefs, "avatarUrl") ||
    readPrefString(prefs, "avatarUri") ||
    readProfileStringField(profile, "avatarUrl") ||
    readProfileStringField(profile, "avatarUri");

  return {
    id: typeof account.$id === "string" ? account.$id : "",
    userId: typeof account.$id === "string" ? account.$id : "",
    email: typeof account.email === "string" ? account.email.trim() : "",
    displayName:
      (typeof account.name === "string" ? account.name.trim() : "") ||
      readProfileStringField(profile, "displayName"),
    username:
      readPrefString(prefs, "username") ||
      readProfileStringField(profile, "username"),
    displayVarId:
      readPrefString(prefs, "displayVarId") ||
      readProfileStringField(profile, "displayVarId"),
    varId:
      readPrefString(prefs, "varId") || readProfileStringField(profile, "varId"),
    role:
      readPrefString(prefs, "role") ||
      readProfileStringField(profile, "role") ||
      "member",
    verified:
      readBoolField(prefs.isVerified) || readBoolField(profile.isVerified),
    cardTier: readCardTierField(prefs.cardTier ?? profile.cardTier),
    accountStatus: readAccountStatus(profile.accountStatus),
    phoneNumber:
      readPrefString(prefs, "phoneNumber") ||
      (typeof account.phone === "string" ? account.phone.trim() : ""),
    nationalId: readPrefString(prefs, "nationalId"),
    bio: readPrefString(prefs, "bio"),
    location: readPrefString(prefs, "location"),
    profession: readPrefString(prefs, "profession"),
    birthDate: readPrefString(prefs, "birthDate"),
    nationality: readPrefString(prefs, "nationality"),
    association: readPrefString(prefs, "association"),
    avatarUrl,
    createdAt:
      (typeof account.$createdAt === "string" ? account.$createdAt : "") ||
      (typeof profile.$createdAt === "string" ? profile.$createdAt : ""),
    emailVerification: readBoolField(account.emailVerification),
  };
}

export async function fetchAdminUserDetails(
  config: AdminConfig,
  rawQuery: string,
) {
  requireServerKey(config);

  const trimmedQuery = rawQuery.trim();
  if (!trimmedQuery) {
    return null;
  }

  let profile =
    (await findProfileByDisplayVarId(
      config,
      normalizeDisplayVarId(trimmedQuery) || trimmedQuery,
    )) ?? (await findProfileSmart(config, trimmedQuery));

  if (!profile) {
    return null;
  }

  const userId =
    typeof profile.userId === "string" && profile.userId.trim()
      ? profile.userId.trim()
      : typeof profile.$id === "string"
        ? profile.$id.trim()
        : "";

  if (!userId) {
    return null;
  }

  const users = new Users(createServerClient(config));
  const account = await users.get(userId);

  return {
    profile,
    user: mapAdminUserDetails(
      account as unknown as Record<string, unknown>,
      profile,
    ),
  };
}

export async function updateAdminUserDetails(
  config: AdminConfig,
  input: {
    displayVarId: string;
    email?: string;
    password?: string;
    displayName?: string;
    username?: string;
    displayVarIdNext?: string;
    phoneNumber?: string;
    nationalId?: string;
    bio?: string;
    location?: string;
    profession?: string;
    birthDate?: string;
    nationality?: string;
    association?: string;
    avatarUrl?: string;
  },
) {
  requireServerKey(config);

  const lookupId = normalizeDisplayVarId(input.displayVarId) || input.displayVarId;
  const profile = await findProfileByDisplayVarId(config, lookupId);

  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const userId =
    typeof profile.userId === "string" && profile.userId.trim()
      ? profile.userId.trim()
      : typeof profile.$id === "string"
        ? profile.$id.trim()
        : "";

  if (!userId) {
    throw new Error("INVALID_PROFILE");
  }

  const users = new Users(createServerClient(config));
  const current = await users.get(userId);
  const currentPrefs = (current.prefs ?? {}) as Record<string, unknown>;
  const currentRole =
    readPrefString(currentPrefs, "role") ||
    readProfileStringField(profile, "role") ||
    "member";

  const nextEmail = readOptionalString(input.email)?.toLowerCase();
  if (nextEmail && nextEmail !== (current.email ?? "").trim().toLowerCase()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      throw new Error("INVALID_EMAIL");
    }

    await users.updateEmail(userId, nextEmail);
  }

  const nextPassword = readOptionalString(input.password);
  if (nextPassword) {
    if (nextPassword.length < 8) {
      throw new Error("WEAK_PASSWORD");
    }

    await users.updatePassword(userId, nextPassword);
  }

  const nextDisplayName = readOptionalString(input.displayName);
  if (nextDisplayName && nextDisplayName !== (current.name ?? "").trim()) {
    await users.updateName(userId, nextDisplayName);
  }

  const nextUsernameRaw = readOptionalString(input.username);
  const nextUsername =
    currentRole === "admin"
      ? readPrefString(currentPrefs, "username") || "var"
      : nextUsernameRaw
        ? nextUsernameRaw.replace(/^@+/, "").toLowerCase()
        : readPrefString(currentPrefs, "username");

  const nextDisplayVarIdRaw = readOptionalString(input.displayVarIdNext);
  const nextDisplayVarId = nextDisplayVarIdRaw
    ? normalizeDisplayVarId(nextDisplayVarIdRaw) ||
      nextDisplayVarIdRaw.toUpperCase()
    : readPrefString(currentPrefs, "displayVarId") ||
      readProfileStringField(profile, "displayVarId");

  if (nextDisplayVarIdRaw) {
    const existing = await findProfileByDisplayVarId(config, nextDisplayVarId);
    const existingUserId =
      existing && typeof existing.userId === "string"
        ? existing.userId.trim()
        : existing && typeof existing.$id === "string"
          ? existing.$id.trim()
          : "";

    if (existing && existingUserId && existingUserId !== userId) {
      throw new Error("DISPLAY_VAR_ID_TAKEN");
    }
  }

  const nextPhone = readOptionalString(input.phoneNumber);
  if (nextPhone !== undefined && nextPhone.startsWith("+")) {
    try {
      await users.updatePhone(userId, nextPhone);
    } catch {
      // keep phone in prefs even if Appwrite phone update fails
    }
  }

  const nextPrefs: Record<string, unknown> = {
    ...currentPrefs,
    username: nextUsername,
    displayVarId: nextDisplayVarId,
    varId:
      readPrefString(currentPrefs, "varId") ||
      readProfileStringField(profile, "varId"),
    phoneNumber: nextPhone ?? readPrefString(currentPrefs, "phoneNumber"),
    nationalId:
      readOptionalString(input.nationalId) ??
      readPrefString(currentPrefs, "nationalId"),
    bio: readOptionalString(input.bio) ?? readPrefString(currentPrefs, "bio"),
    location:
      readOptionalString(input.location) ??
      readPrefString(currentPrefs, "location"),
    profession:
      readOptionalString(input.profession) ??
      readPrefString(currentPrefs, "profession"),
    birthDate:
      readOptionalString(input.birthDate) ??
      readPrefString(currentPrefs, "birthDate"),
    nationality:
      readOptionalString(input.nationality) ??
      readPrefString(currentPrefs, "nationality"),
    association:
      readOptionalString(input.association) ??
      readPrefString(currentPrefs, "association"),
    avatarUrl:
      readOptionalString(input.avatarUrl) ??
      readPrefString(currentPrefs, "avatarUrl"),
    avatarUri:
      readOptionalString(input.avatarUrl) ??
      readPrefString(currentPrefs, "avatarUri"),
    role: currentRole,
    adminLabel: currentRole === "admin" ? "VAR" : "",
    cardTier: readCardTierField(currentPrefs.cardTier ?? profile.cardTier),
    isVerified:
      readBoolField(currentPrefs.isVerified) ||
      readBoolField(profile.isVerified),
  };

  await users.updatePrefs(userId, { prefs: nextPrefs });

  const profilePatch = withRequiredProfileFields(profile, {
    displayName:
      nextDisplayName ||
      (typeof current.name === "string" ? current.name.trim() : "") ||
      readProfileStringField(profile, "displayName"),
    username: nextUsername,
    displayVarId: nextDisplayVarId,
    varId:
      readPrefString(currentPrefs, "varId") ||
      readProfileStringField(profile, "varId"),
    avatarUrl: readPrefString(nextPrefs, "avatarUrl"),
    avatarUri: readPrefString(nextPrefs, "avatarUri"),
    role: currentRole,
    isVerified: readBoolField(nextPrefs.isVerified) ? "true" : "false",
    cardTier: readCardTierField(nextPrefs.cardTier),
  }) as Record<string, unknown>;

  await updateDocumentWithFallback(
    config,
    config.profilesCollectionId,
    resolveProfileDocumentId(profile),
    [profilePatch, { ...profilePatch, cardTier: String(profilePatch.cardTier) }],
  );

  const refreshed = await users.get(userId);

  return mapAdminUserDetails(
    refreshed as unknown as Record<string, unknown>,
    {
      ...profile,
      ...profilePatch,
      displayName:
        typeof profilePatch.displayName === "string"
          ? profilePatch.displayName
          : "",
      username:
        typeof profilePatch.username === "string" ? profilePatch.username : "",
      displayVarId:
        typeof profilePatch.displayVarId === "string"
          ? profilePatch.displayVarId
          : "",
    },
  );
}

export type AdminReportRecord = {
  id: string;
  postId: string;
  postVarId: string;
  reporterVarId: string;
  contentPreview: string;
  reason: string;
  status: string;
  source: string;
  aiScore: number;
  aiFlags: string;
  createdAt: string;
  legacy: boolean;
};

export type AdminFlaggedPostRecord = {
  id: string;
  title: string;
  content: string;
  varId: string;
  authorId: string;
  createdAt: string;
  hidden: boolean;
  aiScore: number;
  aiFlags: string;
  moderationStatus: string;
  reportCount: number;
};

function readNumericField(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function readPostModerationMeta(document: Record<string, unknown>) {
  const aiScore = readNumericField(document.aiScore);
  const reportCount = readNumericField(document.reportCount);
  const moderationStatus =
    typeof document.moderationStatus === "string"
      ? document.moderationStatus.trim().toLowerCase()
      : "";
  const aiFlags =
    typeof document.aiFlags === "string" ? document.aiFlags.trim() : "";

  const flagged =
    moderationStatus === "flagged" ||
    aiScore >= 70 ||
    reportCount >= 3 ||
    aiFlags.length > 0;

  return {
    aiScore,
    reportCount,
    moderationStatus,
    aiFlags,
    flagged,
  };
}

function mapAdminReportDocument(
  document: Record<string, unknown>,
  legacy = false,
): AdminReportRecord {
  return {
    id: typeof document.$id === "string" ? document.$id : "",
    postId:
      typeof document.postId === "string"
        ? document.postId
        : typeof document.targetId === "string"
          ? document.targetId
          : "",
    postVarId: typeof document.postVarId === "string" ? document.postVarId : "",
    reporterVarId:
      typeof document.reporterVarId === "string"
        ? document.reporterVarId
        : typeof document.varId === "string"
          ? document.varId
          : "",
    contentPreview:
      typeof document.contentPreview === "string"
        ? document.contentPreview
        : typeof document.value === "string" && document.value !== "[report]"
          ? document.value
          : "",
    reason:
      typeof document.reason === "string" && document.reason.trim()
        ? document.reason.trim()
        : legacy
          ? "user_report_legacy"
          : "user_report",
    status:
      typeof document.status === "string" && document.status.trim()
        ? document.status.trim().toLowerCase()
        : legacy
          ? document.active === false ||
              (typeof document.value === "string" &&
                document.value.startsWith("[report:"))
            ? "dismissed"
            : "open"
          : "open",
    source:
      typeof document.source === "string" && document.source.trim()
        ? document.source.trim()
        : legacy
          ? "user"
          : "user",
    aiScore: readNumericField(document.aiScore),
    aiFlags:
      typeof document.aiFlags === "string" ? document.aiFlags.trim() : "",
    createdAt:
      typeof document.$createdAt === "string" ? document.$createdAt : "",
    legacy,
  };
}

function mapAdminFlaggedPost(document: Record<string, unknown>) {
  const moderation = readPostModerationMeta(document);

  return {
    id: typeof document.$id === "string" ? document.$id : "",
    title: typeof document.title === "string" ? document.title : "",
    content: typeof document.content === "string" ? document.content : "",
    varId: typeof document.varId === "string" ? document.varId : "",
    authorId: typeof document.authorId === "string" ? document.authorId : "",
    createdAt:
      typeof document.$createdAt === "string" ? document.$createdAt : "",
    hidden: readPostHidden(document),
    aiScore: moderation.aiScore,
    aiFlags: moderation.aiFlags,
    moderationStatus: moderation.moderationStatus,
    reportCount: moderation.reportCount,
  } satisfies AdminFlaggedPostRecord;
}

export async function listAdminReports(
  config: AdminConfig,
  options: { status?: string; limit?: number; offset?: number } = {},
) {
  requireServerKey(config);

  if (!config.databaseId) {
    return { reports: [] as AdminReportRecord[], total: 0, source: "none" };
  }

  const databases = new Databases(createServerClient(config));
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const status = (options.status ?? "open").trim().toLowerCase() || "open";
  const filterByStatus = status !== "all";

  if (config.reportsCollectionId) {
    try {
      const queries = [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ];

      if (filterByStatus) {
        queries.unshift(Query.equal("status", status));
      }

      const response = await databases.listDocuments(
        config.databaseId,
        config.reportsCollectionId,
        queries,
      );

      return {
        reports: response.documents.map((document) =>
          mapAdminReportDocument(
            document as unknown as Record<string, unknown>,
            false,
          ),
        ),
        total: response.total,
        source: "reports",
        limit,
        offset,
        status,
      };
    } catch {
      // Fall back to legacy interactions if the reports collection is missing.
    }
  }

  if (!config.socialInteractionsCollectionId) {
    return {
      reports: [] as AdminReportRecord[],
      total: 0,
      source: "none",
      limit,
      offset,
      status,
    };
  }

  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.socialInteractionsCollectionId,
      [
        Query.equal("mode", "x"),
        Query.equal("action", "comment"),
        Query.equal("value", "[report]"),
        Query.orderDesc("$createdAt"),
        Query.limit(Math.min(limit + offset, 100)),
      ],
    );

    const allReports = response.documents
      .map((document) =>
        mapAdminReportDocument(
          document as unknown as Record<string, unknown>,
          true,
        ),
      )
      .filter((report) => (filterByStatus ? report.status === status : true));

    const reports = allReports.slice(offset, offset + limit);

    return {
      reports,
      total: allReports.length,
      source: "legacy",
      limit,
      offset,
      status,
    };
  } catch {
    return {
      reports: [] as AdminReportRecord[],
      total: 0,
      source: "none",
      limit,
      offset,
      status,
    };
  }
}

export async function getAdminReportDetails(
  config: AdminConfig,
  input: { reportId: string; legacy?: boolean },
) {
  requireServerKey(config);

  const reportId = input.reportId.trim();
  if (!reportId || !config.databaseId) {
    throw new Error("INVALID_REPORT");
  }

  const databases = new Databases(createServerClient(config));
  let report: AdminReportRecord | null = null;

  if (!input.legacy && config.reportsCollectionId) {
    try {
      const document = await databases.getDocument(
        config.databaseId,
        config.reportsCollectionId,
        reportId,
      );
      report = mapAdminReportDocument(
        document as unknown as Record<string, unknown>,
        false,
      );
    } catch {
      // try legacy below
    }
  }

  if (!report && config.socialInteractionsCollectionId) {
    const document = await databases.getDocument(
      config.databaseId,
      config.socialInteractionsCollectionId,
      reportId,
    );
    report = mapAdminReportDocument(
      document as unknown as Record<string, unknown>,
      true,
    );
  }

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  let post: {
    id: string;
    title: string;
    content: string;
    varId: string;
    hidden: boolean;
    createdAt: string;
  } | null = null;

  if (report.postId && config.postsCollectionId) {
    try {
      const document = await databases.getDocument(
        config.databaseId,
        config.postsCollectionId,
        report.postId,
      );
      post = {
        id: typeof document.$id === "string" ? document.$id : report.postId,
        title: typeof document.title === "string" ? document.title : "",
        content: typeof document.content === "string" ? document.content : "",
        varId: typeof document.varId === "string" ? document.varId : "",
        hidden: readPostHidden(document as unknown as Record<string, unknown>),
        createdAt:
          typeof document.$createdAt === "string" ? document.$createdAt : "",
      };
    } catch {
      post = null;
    }
  }

  return { report, post };
}

export async function reviewAdminReport(
  config: AdminConfig,
  input: {
    reportId: string;
    legacy?: boolean;
    status: "dismissed" | "resolved";
    hidePost?: boolean;
  },
) {
  requireServerKey(config);

  if (!config.databaseId || !input.reportId.trim()) {
    throw new Error("INVALID_REPORT");
  }

  const databases = new Databases(createServerClient(config));
  const nextStatus = input.status;

  if (input.legacy && config.socialInteractionsCollectionId) {
    await databases.updateDocument(
      config.databaseId,
      config.socialInteractionsCollectionId,
      input.reportId.trim(),
      {
        active: false,
        value: `[report:${nextStatus}]`,
      },
    );
    return { id: input.reportId.trim(), status: nextStatus, legacy: true };
  }

  if (!config.reportsCollectionId) {
    throw new Error("MISSING_REPORTS_COLLECTION");
  }

  const existing = await databases.getDocument(
    config.databaseId,
    config.reportsCollectionId,
    input.reportId.trim(),
  );
  const existingRecord = existing as unknown as Record<string, unknown>;

  await databases.updateDocument(
    config.databaseId,
    config.reportsCollectionId,
    input.reportId.trim(),
    {
      status: nextStatus,
    },
  );

  if (input.hidePost && input.status === "resolved") {
    const postId =
      typeof existingRecord.postId === "string"
        ? existingRecord.postId.trim()
        : "";
    if (postId) {
      await updatePostVisibility(config, postId, true);
    }
  }

  return { id: input.reportId.trim(), status: nextStatus, legacy: false };
}

export async function listFlaggedAdminPosts(
  config: AdminConfig,
  options: { limit?: number } = {},
) {
  requireServerKey(config);

  if (!config.databaseId) {
    return { posts: [] as AdminFlaggedPostRecord[], total: 0 };
  }

  const databases = new Databases(createServerClient(config));
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);

  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.postsCollectionId,
      [
        Query.equal("moderationStatus", "flagged"),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ],
    );

    return {
      posts: response.documents.map((document) =>
        mapAdminFlaggedPost(document as unknown as Record<string, unknown>),
      ),
      total: response.total,
    };
  } catch {
    const response = await databases.listDocuments(
      config.databaseId,
      config.postsCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(Math.max(limit, 100))],
    );

    const posts = response.documents
      .map((document) =>
        mapAdminFlaggedPost(document as unknown as Record<string, unknown>),
      )
      .filter((post) => {
        const moderation = readPostModerationMeta({
          aiScore: post.aiScore,
          aiFlags: post.aiFlags,
          moderationStatus: post.moderationStatus,
          reportCount: post.reportCount,
        });
        return moderation.flagged;
      })
      .slice(0, limit);

    return { posts, total: posts.length };
  }
}

export async function flagAdminPostForModeration(
  config: AdminConfig,
  input: {
    postId: string;
    aiScore?: number;
    aiFlags?: string;
    moderationStatus?: string;
  },
) {
  requireServerKey(config);

  const postId = input.postId.trim();
  if (!postId) {
    throw new Error("INVALID_POST");
  }

  const aiScore = Math.max(0, Math.min(input.aiScore ?? 85, 100));
  const aiFlags = (input.aiFlags ?? "ai_review").trim() || "ai_review";
  const moderationStatus = input.moderationStatus?.trim() || "flagged";

  await updateDocumentWithFallback(
    config,
    config.postsCollectionId,
    postId,
    [
      {
        moderationStatus,
        aiScore: String(aiScore),
        aiFlags,
      },
      {
        moderationStatus,
        aiScore,
        aiFlags,
      },
    ],
  );

  return { postId, aiScore, aiFlags, moderationStatus };
}

export type AdminCommentRecord = {
  id: string;
  varId: string;
  targetId: string;
  content: string;
  mode: string;
  action: string;
  active: boolean;
  createdAt: string;
  source: "socialinteractions" | "comments";
};

function mapAdminCommentDocument(
  document: Record<string, unknown>,
  source: AdminCommentRecord["source"],
): AdminCommentRecord {
  const activeRaw = document.active;
  const active =
    typeof activeRaw === "undefined" ? true : readBoolField(activeRaw);

  return {
    id: typeof document.$id === "string" ? document.$id : "",
    varId: typeof document.varId === "string" ? document.varId : "",
    targetId:
      typeof document.targetId === "string"
        ? document.targetId
        : typeof document.postId === "string"
          ? document.postId
          : typeof document.videoId === "string"
            ? document.videoId
            : "",
    content:
      typeof document.value === "string"
        ? document.value
        : typeof document.content === "string"
          ? document.content
          : "",
    mode:
      typeof document.mode === "string"
        ? document.mode
        : typeof document.surface === "string"
          ? document.surface
          : "x",
    action:
      typeof document.action === "string"
        ? document.action
        : typeof document.type === "string"
          ? document.type
          : "comment",
    active,
    createdAt:
      typeof document.$createdAt === "string" ? document.$createdAt : "",
    source,
  };
}

export async function listAdminComments(
  config: AdminConfig,
  options: { limit?: number } = {},
) {
  requireServerKey(config);

  if (!config.databaseId) {
    return { comments: [] as AdminCommentRecord[], total: 0, source: "none" };
  }

  const databases = new Databases(createServerClient(config));
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);

  if (config.socialInteractionsCollectionId) {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.socialInteractionsCollectionId,
        [
          Query.equal("action", ["reply", "comment"]),
          Query.orderDesc("$createdAt"),
          Query.limit(limit),
        ],
      );

      return {
        comments: response.documents.map((document) =>
          mapAdminCommentDocument(
            document as unknown as Record<string, unknown>,
            "socialinteractions",
          ),
        ),
        total: response.total,
        source: "socialinteractions",
      };
    } catch {
      // try comments collection fallback
    }
  }

  if (config.commentsCollectionId) {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.commentsCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(limit)],
      );

      return {
        comments: response.documents.map((document) =>
          mapAdminCommentDocument(
            document as unknown as Record<string, unknown>,
            "comments",
          ),
        ),
        total: response.total,
        source: "comments",
      };
    } catch {
      // ignore
    }
  }

  return { comments: [] as AdminCommentRecord[], total: 0, source: "none" };
}

export async function updateAdminCommentVisibility(
  config: AdminConfig,
  input: { commentId: string; hidden: boolean; source?: string },
) {
  requireServerKey(config);

  const commentId = input.commentId.trim();
  if (!commentId) {
    throw new Error("INVALID_COMMENT");
  }

  const collectionId =
    input.source === "comments" && config.commentsCollectionId
      ? config.commentsCollectionId
      : config.socialInteractionsCollectionId;

  if (!collectionId) {
    throw new Error("MISSING_COMMENTS_COLLECTION");
  }

  const databases = new Databases(createServerClient(config));
  const active = !input.hidden;

  await updateDocumentWithFallback(
    config,
    collectionId,
    commentId,
    [{ active }, { active: active ? "true" : "false" }, { isHidden: input.hidden }],
  );

  return { commentId, hidden: input.hidden, active };
}

export async function deleteAdminComment(
  config: AdminConfig,
  input: { commentId: string; source?: string },
) {
  requireServerKey(config);

  const commentId = input.commentId.trim();
  if (!commentId) {
    throw new Error("INVALID_COMMENT");
  }

  const collectionId =
    input.source === "comments" && config.commentsCollectionId
      ? config.commentsCollectionId
      : config.socialInteractionsCollectionId;

  if (!collectionId) {
    throw new Error("MISSING_COMMENTS_COLLECTION");
  }

  const databases = new Databases(createServerClient(config));
  await databases.deleteDocument(config.databaseId, collectionId, commentId);

  return { commentId };
}

export type AdminKeyRole =
  | "super_admin"
  | "developer"
  | "moderator"
  | "guest";

export type AdminKeyStatus = "active" | "revoked" | "expired";

export type AdminKeySummary = {
  id: string;
  label: string;
  role: AdminKeyRole;
  roleLabel: string;
  keyPreview: string;
  status: AdminKeyStatus;
  expiryLabel: string;
  expiresAt: string;
  createdAt: string;
  createdByAdminId: string;
  createdByEmail: string;
};

const ADMIN_KEY_ROLE_LABELS: Record<AdminKeyRole, string> = {
  super_admin: "مسؤول رئيسي (Super Admin)",
  developer: "مشرف تقني (Developer)",
  moderator: "مدير محتوى (Moderator)",
  guest: "مفتاح تجريبي (Guest Account)",
};

export function normalizeAdminKeyRole(value: unknown): AdminKeyRole {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (raw === "super_admin" || raw.includes("super")) {
    return "super_admin";
  }

  if (raw === "developer" || raw.includes("developer") || raw.includes("تقني")) {
    return "developer";
  }

  if (raw === "moderator" || raw.includes("moderator") || raw.includes("محتوى")) {
    return "moderator";
  }

  return "guest";
}

export function formatAdminKeyRoleLabel(role: AdminKeyRole) {
  return ADMIN_KEY_ROLE_LABELS[role] || ADMIN_KEY_ROLE_LABELS.guest;
}

export function generateAdminKeySecret() {
  const segment = () => randomBytes(2).toString("hex").toUpperCase();
  return `KEY-${segment()}-${segment()}-${segment()}`;
}

export function hashAdminKeySecret(secret: string) {
  return createHash("sha256").update(secret.trim()).digest("hex");
}

export function buildAdminKeyPreview(secret: string) {
  const parts = secret.trim().split("-");

  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}-****-****`;
  }

  return `${secret.slice(0, 8)}-****`;
}

export function resolveAdminKeyExpiry(input: {
  expiryOption: string;
  customDate?: string;
}) {
  const option = input.expiryOption.trim();
  const customDate = input.customDate?.trim() || "";

  if (option === "Never" || option === "لا ينتهي أبداً (Never)") {
    return { expiresAt: "", expiryLabel: "لا ينتهي أبداً (Never)" };
  }

  if (option === "Custom Date" || option === "تاريخ مخصص (Custom Date)") {
    if (!customDate) {
      throw new Error("MISSING_CUSTOM_DATE");
    }

    const parsed = new Date(`${customDate}T23:59:59.999Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("INVALID_CUSTOM_DATE");
    }

    return {
      expiresAt: parsed.toISOString(),
      expiryLabel: `مخصص: ${customDate}`,
    };
  }

  const dayMap: Record<string, number> = {
    "7 Days": 7,
    "7 أيام (7 Days)": 7,
    "30 days": 30,
    "30 يوم (30 days)": 30,
    "90 days": 90,
    "90 يوم (90 days)": 90,
    "1 Year": 365,
    "سنة واحدة (1 Year)": 365,
  };

  const days = dayMap[option];
  if (!days) {
    return { expiresAt: "", expiryLabel: option || "Never" };
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return {
    expiresAt: expiresAt.toISOString(),
    expiryLabel: option,
  };
}

function readAdminKeyStatus(
  statusValue: unknown,
  expiresAtValue: unknown,
): AdminKeyStatus {
  const status =
    typeof statusValue === "string" ? statusValue.trim().toLowerCase() : "active";

  if (status === "revoked") {
    return "revoked";
  }

  const expiresAt =
    typeof expiresAtValue === "string" ? expiresAtValue.trim() : "";

  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt);
    if (Number.isFinite(expiresMs) && expiresMs < Date.now()) {
      return "expired";
    }
  }

  return status === "expired" ? "expired" : "active";
}

function mapAdminKeyDocument(document: Record<string, unknown>): AdminKeySummary {
  const role = normalizeAdminKeyRole(document.role);
  const expiresAt =
    typeof document.expiresAt === "string" ? document.expiresAt.trim() : "";

  return {
    id: typeof document.$id === "string" ? document.$id : "",
    label: typeof document.label === "string" ? document.label : "",
    role,
    roleLabel: formatAdminKeyRoleLabel(role),
    keyPreview:
      typeof document.keyPreview === "string" ? document.keyPreview : "KEY-****",
    status: readAdminKeyStatus(document.status, expiresAt),
    expiryLabel:
      typeof document.expiryLabel === "string" ? document.expiryLabel : "—",
    expiresAt,
    createdAt:
      typeof document.$createdAt === "string" ? document.$createdAt : "",
    createdByAdminId:
      typeof document.createdByAdminId === "string"
        ? document.createdByAdminId
        : "",
    createdByEmail:
      typeof document.createdByEmail === "string"
        ? document.createdByEmail
        : "",
  };
}

export async function listAdminKeys(config: AdminConfig, limit = 100) {
  requireServerKey(config);

  if (!config.databaseId || !config.adminKeysCollectionId) {
    return [];
  }

  const databases = new Databases(createServerClient(config));
  const response = await databases.listDocuments(
    config.databaseId,
    config.adminKeysCollectionId,
    [Query.orderDesc("$createdAt"), Query.limit(Math.min(Math.max(limit, 1), 100))],
  );

  return response.documents.map((document) =>
    mapAdminKeyDocument(document as unknown as Record<string, unknown>),
  );
}

export async function createAdminKey(
  config: AdminConfig,
  input: {
    label: string;
    role: string;
    expiryOption: string;
    customDate?: string;
    admin: AdminActor;
  },
) {
  requireServerKey(config);

  const label = input.label.trim();
  if (!label) {
    throw new Error("MISSING_LABEL");
  }

  const { expiresAt, expiryLabel } = resolveAdminKeyExpiry({
    expiryOption: input.expiryOption,
    customDate: input.customDate,
  });
  const role = normalizeAdminKeyRole(input.role);
  const secret = generateAdminKeySecret();
  const keyHash = hashAdminKeySecret(secret);
  const keyPreview = buildAdminKeyPreview(secret);

  const databases = new Databases(createServerClient(config));
  const document = await databases.createDocument(
    config.databaseId,
    config.adminKeysCollectionId,
    ID.unique(),
    {
      label,
      role,
      keyHash,
      keyPreview,
      status: "active",
      expiresAt,
      expiryLabel,
      createdByAdminId: input.admin.id,
      createdByEmail: input.admin.email,
    },
  );

  return {
    key: mapAdminKeyDocument(document as unknown as Record<string, unknown>),
    secret,
  };
}

export async function setAdminKeyStatus(
  config: AdminConfig,
  keyId: string,
  status: "active" | "revoked",
) {
  requireServerKey(config);

  const normalizedId = keyId.trim();
  if (!normalizedId) {
    throw new Error("MISSING_KEY_ID");
  }

  const databases = new Databases(createServerClient(config));
  const document = await databases.updateDocument(
    config.databaseId,
    config.adminKeysCollectionId,
    normalizedId,
    { status },
  );

  return mapAdminKeyDocument(document as unknown as Record<string, unknown>);
}

export async function deleteAdminKey(config: AdminConfig, keyId: string) {
  requireServerKey(config);

  const normalizedId = keyId.trim();
  if (!normalizedId) {
    throw new Error("MISSING_KEY_ID");
  }

  const databases = new Databases(createServerClient(config));
  await databases.deleteDocument(
    config.databaseId,
    config.adminKeysCollectionId,
    normalizedId,
  );

  return { keyId: normalizedId };
}

export const APP_SETTINGS_DOCUMENT_ID = "global";

export type AppUiMode = "x" | "tiktok";

export type AppRuntimeSettings = {
  uiMode: AppUiMode;
  richIconsEnabled: boolean;
  gpuAccelerationEnabled: boolean;
  updatedAt: string;
  updatedByAdminId: string;
  updatedByEmail: string;
};

const DEFAULT_APP_RUNTIME_SETTINGS: AppRuntimeSettings = {
  uiMode: "tiktok",
  richIconsEnabled: true,
  gpuAccelerationEnabled: true,
  updatedAt: "",
  updatedByAdminId: "",
  updatedByEmail: "",
};

export function normalizeAppUiMode(value: unknown): AppUiMode {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (raw === "x" || raw === "x-mode" || raw.includes("x-mode")) {
    return "x";
  }

  return "tiktok";
}

function mapAppSettingsDocument(
  document: Record<string, unknown> | null | undefined,
): AppRuntimeSettings {
  if (!document) {
    return { ...DEFAULT_APP_RUNTIME_SETTINGS };
  }

  return {
    uiMode: normalizeAppUiMode(document.uiMode),
    richIconsEnabled:
      typeof document.richIconsEnabled === "undefined"
        ? DEFAULT_APP_RUNTIME_SETTINGS.richIconsEnabled
        : readBoolField(document.richIconsEnabled),
    gpuAccelerationEnabled:
      typeof document.gpuAccelerationEnabled === "undefined"
        ? DEFAULT_APP_RUNTIME_SETTINGS.gpuAccelerationEnabled
        : readBoolField(document.gpuAccelerationEnabled),
    updatedAt:
      typeof document.$updatedAt === "string"
        ? document.$updatedAt
        : typeof document.updatedAt === "string"
          ? document.updatedAt
          : "",
    updatedByAdminId:
      typeof document.updatedByAdminId === "string"
        ? document.updatedByAdminId
        : "",
    updatedByEmail:
      typeof document.updatedByEmail === "string"
        ? document.updatedByEmail
        : "",
  };
}

export async function readAppRuntimeSettings(
  config: AdminConfig,
): Promise<AppRuntimeSettings> {
  if (!config.databaseId || !config.appSettingsCollectionId) {
    return { ...DEFAULT_APP_RUNTIME_SETTINGS };
  }

  try {
    requireServerKey(config);
    const databases = new Databases(createServerClient(config));
    const document = await databases.getDocument(
      config.databaseId,
      config.appSettingsCollectionId,
      APP_SETTINGS_DOCUMENT_ID,
    );

    return mapAppSettingsDocument(
      document as unknown as Record<string, unknown>,
    );
  } catch (error) {
    if (
      error instanceof AppwriteException &&
      (error.code === 404 || error.type === "document_not_found")
    ) {
      return ensureAppRuntimeSettingsDocument(config);
    }

    return { ...DEFAULT_APP_RUNTIME_SETTINGS };
  }
}

export async function ensureAppRuntimeSettingsDocument(config: AdminConfig) {
  requireServerKey(config);

  const databases = new Databases(createServerClient(config));

  try {
    const existing = await databases.getDocument(
      config.databaseId,
      config.appSettingsCollectionId,
      APP_SETTINGS_DOCUMENT_ID,
    );

    return mapAppSettingsDocument(
      existing as unknown as Record<string, unknown>,
    );
  } catch {
    const created = await databases.createDocument(
      config.databaseId,
      config.appSettingsCollectionId,
      APP_SETTINGS_DOCUMENT_ID,
      {
        uiMode: DEFAULT_APP_RUNTIME_SETTINGS.uiMode,
        richIconsEnabled: "true",
        gpuAccelerationEnabled: "true",
        updatedAt: new Date().toISOString(),
        updatedByAdminId: "",
        updatedByEmail: "",
      },
    );

    return mapAppSettingsDocument(
      created as unknown as Record<string, unknown>,
    );
  }
}

export async function updateAppRuntimeSettings(
  config: AdminConfig,
  input: {
    uiMode?: AppUiMode;
    richIconsEnabled?: boolean;
    gpuAccelerationEnabled?: boolean;
    admin: AdminActor;
  },
) {
  requireServerKey(config);

  const current = await ensureAppRuntimeSettingsDocument(config);
  const nextSettings: AppRuntimeSettings = {
    uiMode: input.uiMode ?? current.uiMode,
    richIconsEnabled:
      typeof input.richIconsEnabled === "boolean"
        ? input.richIconsEnabled
        : current.richIconsEnabled,
    gpuAccelerationEnabled:
      typeof input.gpuAccelerationEnabled === "boolean"
        ? input.gpuAccelerationEnabled
        : current.gpuAccelerationEnabled,
    updatedAt: new Date().toISOString(),
    updatedByAdminId: input.admin.id,
    updatedByEmail: input.admin.email,
  };

  const databases = new Databases(createServerClient(config));
  const document = await databases.updateDocument(
    config.databaseId,
    config.appSettingsCollectionId,
    APP_SETTINGS_DOCUMENT_ID,
    {
      uiMode: nextSettings.uiMode,
      richIconsEnabled: nextSettings.richIconsEnabled ? "true" : "false",
      gpuAccelerationEnabled: nextSettings.gpuAccelerationEnabled
        ? "true"
        : "false",
      updatedAt: nextSettings.updatedAt,
      updatedByAdminId: nextSettings.updatedByAdminId,
      updatedByEmail: nextSettings.updatedByEmail,
    },
  );

  return mapAppSettingsDocument(document as unknown as Record<string, unknown>);
}
