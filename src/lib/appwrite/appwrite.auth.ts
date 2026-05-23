import { OAuthProvider as WebOAuthProvider } from "appwrite";
import type {
  AppwriteAccountDocument,
  AppwriteAuthUser,
  AppwriteGoogleOAuthChallenge,
  AppwriteProfilePrefs,
  AppwriteRecoveryChallenge,
} from "./appwrite.types";
import {
  DEFAULT_APPWRITE_AVATAR_URL,
  VAR_ADMIN_USERNAME,
  CONFIGURED_VAR_ADMIN_EMAIL,
  APPWRITE_CONFIG,
} from "./appwrite.config";
import {
  normalizeAppwriteUsername,
  buildAppwriteVarId,
  buildAppwriteDisplayVarId,
  toAppwriteAuthUser,
  resolveAppwriteAvatarUrl,
  isUnauthorizedAppwriteError,
  isActiveAppwriteSessionError,
} from "./appwrite.helpers";
import {
  IS_WEB_RUNTIME,
  AppwriteID,
  getAccountBridge,
  getAccountService,
  type AppwriteAccountBridge,
  type AppwriteAccountInstance,
} from "./appwrite.client";

// ─── Session helpers ─────────────────────────────────────────────────────────

function hasWebAppwriteSessionCookie() {
  if (!IS_WEB_RUNTIME || typeof document === "undefined") {
    return false;
  }

  const cookiePrefix = `a_session_${APPWRITE_CONFIG.projectId}=`;

  return document.cookie
    .split(";")
    .some((entry) => entry.trim().startsWith(cookiePrefix));
}

function hasWebAppwriteSessionFallback() {
  if (!IS_WEB_RUNTIME || typeof window === "undefined") {
    return false;
  }

  try {
    const rawCookieFallback = window.localStorage.getItem("cookieFallback");

    if (!rawCookieFallback) {
      return false;
    }

    const parsedCookieFallback = JSON.parse(rawCookieFallback) as Record<
      string,
      unknown
    > | null;
    const sessionValue =
      parsedCookieFallback?.[`a_session_${APPWRITE_CONFIG.projectId}`];

    return typeof sessionValue === "string" && sessionValue.trim().length > 0;
  } catch {
    return false;
  }
}

export function hasStoredAppwriteSession() {
  if (!IS_WEB_RUNTIME) {
    return true;
  }

  return hasWebAppwriteSessionCookie() || hasWebAppwriteSessionFallback();
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

function getCurrentWindowUrl() {
  if (!IS_WEB_RUNTIME || typeof window === "undefined") {
    return null;
  }

  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

export function getAppwriteRecoveryRedirectUrl() {
  const configuredUrl =
    process.env.EXPO_PUBLIC_APPWRITE_PASSWORD_RECOVERY_URL?.trim() || "";

  if (configuredUrl) {
    return configuredUrl;
  }

  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl) {
    return "";
  }

  return `${currentUrl.origin}${currentUrl.pathname}`;
}

// ─── Recovery challenge ───────────────────────────────────────────────────────

const GOOGLE_OAUTH_PROVIDER_QUERY_KEY = "appwriteOAuthProvider";
const GOOGLE_OAUTH_STATUS_QUERY_KEY = "appwriteOAuthStatus";
const GOOGLE_OAUTH_PROVIDER_VALUE = "google";

function hasGoogleOAuthRedirectMarker(currentUrl: URL) {
  return (
    currentUrl.searchParams
      .get(GOOGLE_OAUTH_PROVIDER_QUERY_KEY)
      ?.trim()
      .toLowerCase() === GOOGLE_OAUTH_PROVIDER_VALUE
  );
}

export function readAppwriteRecoveryChallenge(): AppwriteRecoveryChallenge | null {
  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl) {
    return null;
  }

  if (hasGoogleOAuthRedirectMarker(currentUrl)) {
    return null;
  }

  const userId = currentUrl.searchParams.get("userId")?.trim() || "";
  const secret = currentUrl.searchParams.get("secret")?.trim() || "";

  if (!userId || !secret) {
    return null;
  }

  return {
    userId,
    secret,
    email: currentUrl.searchParams.get("email")?.trim().toLowerCase() || "",
  };
}

export function hasAppwriteRecoveryChallenge() {
  return Boolean(readAppwriteRecoveryChallenge());
}

export function clearAppwriteRecoveryChallenge() {
  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl || typeof window === "undefined") {
    return;
  }

  currentUrl.searchParams.delete("userId");
  currentUrl.searchParams.delete("secret");
  currentUrl.searchParams.delete("expire");
  currentUrl.searchParams.delete("project");
  currentUrl.searchParams.delete("email");

  const nextLocation = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  window.history.replaceState({}, "", nextLocation || "/");
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

function getGoogleOAuthRedirectUrl(status: "success" | "failure") {
  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl) {
    return "";
  }

  const redirectUrl = new URL(`${currentUrl.origin}${currentUrl.pathname}`);

  redirectUrl.searchParams.set(
    GOOGLE_OAUTH_PROVIDER_QUERY_KEY,
    GOOGLE_OAUTH_PROVIDER_VALUE,
  );
  redirectUrl.searchParams.set(GOOGLE_OAUTH_STATUS_QUERY_KEY, status);
  redirectUrl.hash = currentUrl.hash;

  return redirectUrl.toString();
}

export function readAppwriteGoogleOAuthChallenge(): AppwriteGoogleOAuthChallenge | null {
  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl || !hasGoogleOAuthRedirectMarker(currentUrl)) {
    return null;
  }

  const status =
    currentUrl.searchParams
      .get(GOOGLE_OAUTH_STATUS_QUERY_KEY)
      ?.trim()
      .toLowerCase() === "failure"
      ? "failure"
      : "success";

  return {
    status,
    userId: currentUrl.searchParams.get("userId")?.trim() || "",
    secret: currentUrl.searchParams.get("secret")?.trim() || "",
  };
}

export function clearAppwriteGoogleOAuthChallenge() {
  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl || typeof window === "undefined") {
    return;
  }

  currentUrl.searchParams.delete(GOOGLE_OAUTH_PROVIDER_QUERY_KEY);
  currentUrl.searchParams.delete(GOOGLE_OAUTH_STATUS_QUERY_KEY);
  currentUrl.searchParams.delete("userId");
  currentUrl.searchParams.delete("secret");
  currentUrl.searchParams.delete("expire");
  currentUrl.searchParams.delete("project");

  const nextLocation = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  window.history.replaceState({}, "", nextLocation || "/");
}

type WebOAuthSessionAccount = {
  createOAuth2Token: (input: {
    provider: string;
    success?: string;
    failure?: string;
    scopes?: string[];
  }) => Promise<unknown> | void;
};

export async function loginAppwriteWithGoogle() {
  if (!IS_WEB_RUNTIME) {
    throw new Error("تسجيل Google مدعوم حاليًا على نسخة الويب فقط.");
  }

  const currentUrl = getCurrentWindowUrl();

  if (!currentUrl) {
    throw new Error("تعذر تحديد رابط العودة الحالي لتسجيل Google.");
  }

  const successRedirectUrl = getGoogleOAuthRedirectUrl("success");
  const failureRedirectUrl = getGoogleOAuthRedirectUrl("failure");
  const accountService =
    getAccountService() as unknown as WebOAuthSessionAccount;

  await accountService.createOAuth2Token({
    provider: WebOAuthProvider.Google,
    success: successRedirectUrl,
    failure: failureRedirectUrl,
  });
}

type TokenSessionAccount = AppwriteAccountInstance & {
  createSession: (input: {
    userId: string;
    secret: string;
  }) => Promise<unknown>;
};

export async function completeAppwriteGoogleOAuthSession(
  challenge: AppwriteGoogleOAuthChallenge,
) {
  if (!IS_WEB_RUNTIME) {
    throw new Error("استكمال جلسة Google مدعوم حاليًا على نسخة الويب فقط.");
  }

  if (
    challenge.status !== "success" ||
    !challenge.userId.trim() ||
    !challenge.secret.trim()
  ) {
    throw new Error("رابط الرجوع من Google لا يحتوي على بيانات جلسة صالحة.");
  }

  const accountService = getAccountBridge() as TokenSessionAccount &
    AppwriteAccountBridge;
  const normalizedUserId = challenge.userId.trim();
  const normalizedSecret = challenge.secret.trim();

  try {
    await accountService.createSession({
      userId: normalizedUserId,
      secret: normalizedSecret,
    });
  } catch (error) {
    if (!isActiveAppwriteSessionError(error)) {
      throw error;
    }

    const currentUser = await getCurrentAppwriteUser();

    if (currentUser?.id === normalizedUserId) {
      return currentUser;
    }

    if (!currentUser) {
      throw error;
    }

    await logoutAppwriteUser();
    await accountService.createSession({
      userId: normalizedUserId,
      secret: normalizedSecret,
    });
  }

  const user = await accountService.get();

  return buildSyncedAppwriteAuthUser(
    user as unknown as AppwriteAccountDocument,
  );
}

// ─── Core auth functions ──────────────────────────────────────────────────────

export async function getCurrentAppwriteUser() {
  const accountService = getAccountBridge();

  try {
    const user = await accountService.get();

    return buildSyncedAppwriteAuthUser(
      user as unknown as AppwriteAccountDocument,
    );
  } catch (error) {
    if (isUnauthorizedAppwriteError(error)) {
      return null;
    }

    throw error;
  }
}

export async function loginAppwriteUser(email: string, password: string) {
  return createEmailPasswordSessionSafely(email, password);
}

async function createEmailPasswordSessionSafely(
  email: string,
  password: string,
) {
  const accountService = getAccountBridge();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    await accountService.createEmailPasswordSession(normalizedEmail, password);
  } catch (error) {
    if (!isActiveAppwriteSessionError(error)) {
      throw error;
    }

    const currentUser = await getCurrentAppwriteUser();

    if (currentUser?.email.trim().toLowerCase() === normalizedEmail) {
      return currentUser;
    }

    await logoutAppwriteUser();
    await accountService.createEmailPasswordSession(normalizedEmail, password);
  }

  const user = await accountService.get();

  return buildSyncedAppwriteAuthUser(
    user as unknown as AppwriteAccountDocument,
  );
}

export async function signupAppwriteUser(input: {
  name: string;
  email: string;
  password: string;
  username: string;
}) {
  const accountService = getAccountBridge();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedUsername = normalizeAppwriteUsername(input.username);
  const isVarAdminAccount = normalizedUsername === VAR_ADMIN_USERNAME;

  if (
    isVarAdminAccount &&
    CONFIGURED_VAR_ADMIN_EMAIL &&
    normalizedEmail !== CONFIGURED_VAR_ADMIN_EMAIL
  ) {
    throw new Error("اسم المستخدم var محجوز للبريد الإداري المحدد.");
  }

  await accountService.create(
    AppwriteID.unique(),
    normalizedEmail,
    input.password,
    input.name.trim(),
  );
  const currentUser = await createEmailPasswordSessionSafely(
    normalizedEmail,
    input.password,
  );
  const nextVarId = buildAppwriteVarId(currentUser!.id);
  const nextDisplayVarId = buildAppwriteDisplayVarId(currentUser!.id);

  await accountService.updateName(input.name.trim());
  await accountService.updatePrefs<AppwriteProfilePrefs>({
    prefs: {
      varId: nextVarId,
      displayVarId: nextDisplayVarId,
      username: normalizedUsername,
      avatarUri: DEFAULT_APPWRITE_AVATAR_URL,
      avatarUrl: DEFAULT_APPWRITE_AVATAR_URL,
      role: isVarAdminAccount ? "admin" : "member",
      adminLabel: isVarAdminAccount ? "VAR" : "",
    },
  });

  const user = await accountService.get();

  return buildSyncedAppwriteAuthUser(
    user as unknown as AppwriteAccountDocument,
  );
}

export async function requestAppwritePasswordRecovery(
  email: string,
  redirectUrl = getAppwriteRecoveryRedirectUrl(),
) {
  const accountService = getAccountBridge();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRedirectUrl = redirectUrl.trim();

  if (!normalizedEmail) {
    throw new Error("أدخل بريد الحساب أولاً.");
  }

  if (!normalizedRedirectUrl) {
    throw new Error(
      "رابط استعادة كلمة المرور غير مضبوط لهذا التشغيل. استخدم نسخة الويب أو اضبط EXPO_PUBLIC_APPWRITE_PASSWORD_RECOVERY_URL.",
    );
  }

  await accountService.createRecovery(normalizedEmail, normalizedRedirectUrl);
}

export async function completeAppwritePasswordRecovery(
  userId: string,
  secret: string,
  password: string,
) {
  const accountService = getAccountBridge();
  const normalizedUserId = userId.trim();
  const normalizedSecret = secret.trim();
  const normalizedPassword = password.trim();

  if (!normalizedUserId || !normalizedSecret) {
    throw new Error("بيانات رابط استعادة كلمة المرور غير مكتملة.");
  }

  if (!normalizedPassword) {
    throw new Error("أدخل كلمة المرور الجديدة أولاً.");
  }

  await accountService.updateRecovery(
    normalizedUserId,
    normalizedSecret,
    normalizedPassword,
  );
}

export async function saveAppwriteUserProfile(input: {
  name: string;
  username: string;
  phoneNumber: string;
  nationalId: string;
  bio: string;
  location: string;
  profession: string;
  birthDate: string;
  nationality: string;
  avatarUri: string;
}) {
  const accountService = getAccountBridge();
  const currentUser = await accountService.get();
  const mappedUser = toAppwriteAuthUser(
    currentUser as unknown as AppwriteAccountDocument,
  );
  const nextUsername =
    mappedUser.role === "admin"
      ? VAR_ADMIN_USERNAME
      : normalizeAppwriteUsername(input.username);
  const nextAvatarUrl = resolveAppwriteAvatarUrl(input.avatarUri);

  await accountService.updateName(input.name.trim());
  await accountService.updatePrefs<AppwriteProfilePrefs>({
    prefs: {
      varId: mappedUser.varId,
      displayVarId: mappedUser.displayVarId,
      username: nextUsername,
      phoneNumber: input.phoneNumber.trim(),
      nationalId: input.nationalId.trim(),
      bio: input.bio.trim(),
      location: input.location.trim(),
      profession: input.profession.trim(),
      birthDate: input.birthDate.trim(),
      nationality: input.nationality.trim(),
      avatarUri: nextAvatarUrl,
      avatarUrl: nextAvatarUrl,
      role: mappedUser.role,
      adminLabel: mappedUser.role === "admin" ? "VAR" : "",
    },
  });

  const updatedUser = await accountService.get();

  return buildSyncedAppwriteAuthUser(
    updatedUser as unknown as AppwriteAccountDocument,
  );
}

export async function logoutAppwriteUser() {
  const accountService = getAccountBridge();

  try {
    await accountService.deleteSession("current");
  } catch (error) {
    if (isUnauthorizedAppwriteError(error)) {
      return;
    }

    throw error;
  }
}

// ─── Internal (used only by auth functions above) ────────────────────────────

async function buildSyncedAppwriteAuthUser(
  document: AppwriteAccountDocument,
): Promise<AppwriteAuthUser> {
  const mappedUser = toAppwriteAuthUser(document);
  const { syncAppwriteProfileIndexRecord } = await import("./appwrite.profile");
  await syncAppwriteProfileIndexRecord(mappedUser);
  return mappedUser;
}
