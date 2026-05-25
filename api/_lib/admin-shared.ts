import { Account, AppwriteException, Client, Databases, ID, Query, Users } from "node-appwrite";
import fs from "node:fs";
import path from "node:path";

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
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Appwrite-Session, X-Appwrite-JWT",
  );
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

export function readSessionHeader(request: { headers?: Record<string, string | string[] | undefined> }) {
  const raw = request.headers?.["x-appwrite-session"];
  return typeof raw === "string" ? raw.trim() : "";
}

export function readJwtHeader(request: { headers?: Record<string, string | string[] | undefined> }) {
  const raw = request.headers?.["x-appwrite-jwt"];
  return typeof raw === "string" ? raw.trim() : "";
}

export type AdminAuth = {
  type: "jwt" | "session";
  token: string;
};

export function readAuthHeader(
  request: { headers?: Record<string, string | string[] | undefined> },
): AdminAuth | null {
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
    session: auth.token,
  } satisfies AdminActor;
}

type AppwriteSession = {
  secret?: string;
};

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

  if (type === "user_invalid_credentials" || message.includes("Invalid credentials")) {
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

  const profileId =
    typeof profile.$id === "string" ? profile.$id.trim() : "";
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
