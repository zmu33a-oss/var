import { Account, Client } from "appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  SESSION_STORAGE_KEY,
  VAR_ADMIN_EMAIL,
} from "./config";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  varId: string;
  displayVarId: string;
};

function createClient() {
  if (!APPWRITE_PROJECT_ID) {
    throw new Error("VITE_APPWRITE_PROJECT_ID غير مضبوط في admin-web/.env");
  }

  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
}

function readPrefsRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function isAdminAccount(input: {
  email: string;
  username: string;
  role: string;
}) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const role = input.role.trim().toLowerCase();

  if (role === "admin") {
    return true;
  }

  if (username === "var") {
    return !VAR_ADMIN_EMAIL || email === VAR_ADMIN_EMAIL;
  }

  return Boolean(VAR_ADMIN_EMAIL) && email === VAR_ADMIN_EMAIL;
}

export function mapAccountToAdminUser(account: {
  $id: string;
  email?: string;
  name?: string;
  prefs?: unknown;
}): AdminSessionUser {
  const prefs = readPrefsRecord(account.prefs);
  const email = (account.email ?? "").trim();
  const username =
    typeof prefs.username === "string" ? prefs.username.trim() : "";
  const role = typeof prefs.role === "string" ? prefs.role : "member";

  if (!isAdminAccount({ email, username, role })) {
    throw new Error("هذا الحساب ليس لديه صلاحية أدمن.");
  }

  return {
    id: account.$id,
    email,
    name: account.name?.trim() || email.split("@")[0] || "VAR Admin",
    username,
    role,
    varId: typeof prefs.varId === "string" ? prefs.varId : "",
    displayVarId:
      typeof prefs.displayVarId === "string" ? prefs.displayVarId : "",
  };
}

export async function loginAdmin(email: string, password: string) {
  const client = createClient();
  const account = new Account(client);

  const session = await account.createEmailPasswordSession(
    email.trim().toLowerCase(),
    password,
  );
  const currentAccount = await account.get();
  const adminUser = mapAccountToAdminUser(currentAccount);

  if (typeof session.secret === "string" && session.secret.trim()) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, session.secret);
  }

  return adminUser;
}

export async function restoreAdminSession() {
  const sessionSecret = sessionStorage.getItem(SESSION_STORAGE_KEY)?.trim();
  if (!sessionSecret) {
    return null;
  }

  const client = createClient();
  client.setSession(sessionSecret);
  const account = new Account(client);

  try {
    const currentAccount = await account.get();
    return mapAccountToAdminUser(currentAccount);
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function logoutAdmin() {
  const sessionSecret = sessionStorage.getItem(SESSION_STORAGE_KEY)?.trim();
  sessionStorage.removeItem(SESSION_STORAGE_KEY);

  if (!sessionSecret) {
    return;
  }

  const client = createClient();
  client.setSession(sessionSecret);
  const account = new Account(client);

  try {
    await account.deleteSession("current");
  } catch {
    // ignore stale sessions during preview logout
  }
}

export function getStoredSessionSecret() {
  return sessionStorage.getItem(SESSION_STORAGE_KEY)?.trim() || "";
}
