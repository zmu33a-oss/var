import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import {
  Account as NativeAccount,
  Avatars as NativeAvatars,
  Client as NativeClient,
  Databases as NativeDatabases,
  ID as NativeID,
  Query as NativeQuery,
  Storage as NativeStorage,
} from "react-native-appwrite";
import {
  Account as WebAccount,
  Avatars as WebAvatars,
  Client as WebClient,
  Databases as WebDatabases,
  ID as WebID,
  Query as WebQuery,
  Storage as WebStorage,
} from "appwrite";
import { APPWRITE_CONFIG, hasAppwriteProjectConfig } from "./appwrite.config";
import {
  normalizeAppwriteVarId,
  shouldDisableAppwriteCollectionRead,
} from "./appwrite.helpers";
import {
  disableAppwriteCollectionRead,
  canAttemptAppwriteCollectionRead,
} from "./appwrite.state";

export const IS_WEB_RUNTIME = Platform.OS === "web";
export const AppwriteID = IS_WEB_RUNTIME ? WebID : NativeID;
export const AppwriteQuery = IS_WEB_RUNTIME ? WebQuery : NativeQuery;

type AppwriteClientInstance = NativeClient | WebClient;
type PingEnabledClient = AppwriteClientInstance & {
  ping: () => Promise<string>;
};

export type AppwriteAccountInstance = NativeAccount | WebAccount;
export type AppwriteDatabasesInstance = NativeDatabases | WebDatabases;
export type AppwriteStorageInstance = NativeStorage | WebStorage;
export type AppwriteAvatarsInstance = NativeAvatars | WebAvatars;

// ─── Client factories ───────────────────────────────────────────────────────

function createConfiguredClient() {
  const client = IS_WEB_RUNTIME
    ? new WebClient()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId)
    : new NativeClient()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId)
        .setPlatform(APPWRITE_CONFIG.platform);

  const pingClient = client as PingEnabledClient;

  pingClient.ping = async () => {
    const response = await fetch(`${APPWRITE_CONFIG.endpoint}/ping`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Appwrite ping failed: ${response.status}`);
    }

    return response.text();
  };

  return pingClient;
}

function createAccountService(client: AppwriteClientInstance) {
  return IS_WEB_RUNTIME
    ? new WebAccount(client as WebClient)
    : new NativeAccount(client as NativeClient);
}

function createDatabasesService(client: AppwriteClientInstance) {
  return IS_WEB_RUNTIME
    ? new WebDatabases(client as WebClient)
    : new NativeDatabases(client as NativeClient);
}

function createStorageService(client: AppwriteClientInstance) {
  return IS_WEB_RUNTIME
    ? new WebStorage(client as WebClient)
    : new NativeStorage(client as NativeClient);
}

function createAvatarsService(client: AppwriteClientInstance) {
  return IS_WEB_RUNTIME
    ? new WebAvatars(client as WebClient)
    : new NativeAvatars(client as NativeClient);
}

// ─── Shared service instances ────────────────────────────────────────────────

export const client = hasAppwriteProjectConfig()
  ? createConfiguredClient()
  : null;

export const appwriteClient = client;

export const account: AppwriteAccountInstance | null = client
  ? createAccountService(client)
  : null;

export const appwriteAccount = account;

export const appwriteDatabases: AppwriteDatabasesInstance | null = client
  ? createDatabasesService(client)
  : null;

export const appwriteStorage: AppwriteStorageInstance | null = client
  ? createStorageService(client)
  : null;

export const appwriteAvatars: AppwriteAvatarsInstance | null = client
  ? createAvatarsService(client)
  : null;

// ─── Service getters ─────────────────────────────────────────────────────────

export function getAccountService() {
  if (!account) {
    throw new Error("Appwrite account service is not available.");
  }

  return account;
}

export function getDatabasesService() {
  if (!appwriteDatabases) {
    throw new Error("Appwrite databases service is not available.");
  }

  if (!APPWRITE_CONFIG.databaseId) {
    throw new Error("Appwrite databaseId is not configured.");
  }

  return appwriteDatabases;
}

// ─── Realtime ────────────────────────────────────────────────────────────────

export type RealtimePayload = Record<string, unknown>;

/**
 * Subscribe to all document changes in an Appwrite collection.
 * Returns an unsubscribe function, or null if Realtime is unavailable.
 */
export function subscribeToAppwriteCollection(
  databaseId: string,
  collectionId: string,
  callback: (payload: RealtimePayload, events: string[]) => void,
): (() => void) | null {
  if (!client || !databaseId || !collectionId) return null;

  const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

  try {
    const unsubscribeFn = (
      client as unknown as {
        subscribe: (
          channel: string,
          cb: (response: { events: string[]; payload: RealtimePayload }) => void,
        ) => (() => void) | undefined;
      }
    ).subscribe(channel, (response) => {
      callback(response.payload, response.events);
    });

    return typeof unsubscribeFn === "function" ? unsubscribeFn : null;
  } catch {
    return null;
  }
}

type AppwriteDocumentsListResponse = {
  documents: unknown[];
};

type AppwriteDatabasesBridge = {
  listDocuments: (
    databaseId: string,
    collectionId: string,
    queries?: string[],
  ) => Promise<AppwriteDocumentsListResponse>;
  createDocument: (
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Record<string, unknown>,
  ) => Promise<unknown>;
  updateDocument: (
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Record<string, unknown>,
  ) => Promise<unknown>;
};

export type AppwriteAccountBridge = {
  get: () => Promise<unknown>;
  create: (
    userId: string,
    email: string,
    password: string,
    name: string,
  ) => Promise<unknown>;
  createEmailPasswordSession: (
    email: string,
    password: string,
  ) => Promise<unknown>;
  createRecovery: (email: string, redirectUrl: string) => Promise<unknown>;
  updateRecovery: (
    userId: string,
    secret: string,
    password: string,
  ) => Promise<unknown>;
  updateName: (name: string) => Promise<unknown>;
  updatePrefs: <Preferences extends Record<string, unknown>>(input: {
    prefs: Partial<Preferences>;
  }) => Promise<unknown>;
  deleteSession: (sessionId: string) => Promise<unknown>;
};

export function getDatabasesBridge(): AppwriteDatabasesBridge {
  return getDatabasesService() as unknown as AppwriteDatabasesBridge;
}

export function getAccountBridge(): AppwriteAccountBridge {
  return getAccountService() as unknown as AppwriteAccountBridge;
}

// ─── Collection helpers ──────────────────────────────────────────────────────

export function hasConfiguredCollection(collectionId: string) {
  return Boolean(APPWRITE_CONFIG.databaseId && collectionId.trim());
}

export function chunkAppwriteQueryValues(values: string[], chunkSize = 100) {
  const chunks: string[][] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function listCollectionDocumentsByVarId(
  collectionId: string,
  varId: string,
  extraQueries: string[] = [],
) {
  if (!hasConfiguredCollection(collectionId)) {
    return [];
  }

  const normalizedVarId = normalizeAppwriteVarId(varId);

  if (!normalizedVarId) {
    return [];
  }

  const databases = getDatabasesBridge();
  const response = await databases.listDocuments(
    APPWRITE_CONFIG.databaseId,
    collectionId,
    [
      AppwriteQuery.equal("varId", normalizedVarId),
      AppwriteQuery.limit(100),
      ...extraQueries,
    ],
  );

  return response.documents;
}

export async function listCollectionDocuments(
  collectionId: string,
  extraQueries: string[] = [],
) {
  if (!hasConfiguredCollection(collectionId)) {
    return [];
  }

  const databases = getDatabasesBridge();
  const response = await databases.listDocuments(
    APPWRITE_CONFIG.databaseId,
    collectionId,
    [AppwriteQuery.limit(500), ...extraQueries],
  );

  return response.documents;
}

export async function listCollectionDocumentsByVarIdSafely(
  collectionId: string,
  varId: string,
  extraQueries: string[] = [],
) {
  if (!canAttemptAppwriteCollectionRead(collectionId)) {
    return [];
  }

  try {
    return await listCollectionDocumentsByVarId(
      collectionId,
      varId,
      extraQueries,
    );
  } catch (error) {
    if (shouldDisableAppwriteCollectionRead(error)) {
      disableAppwriteCollectionRead(collectionId);
      return [];
    }

    throw error;
  }
}

export async function listCollectionDocumentsSafely(
  collectionId: string,
  extraQueries: string[] = [],
) {
  if (!canAttemptAppwriteCollectionRead(collectionId)) {
    return [];
  }

  try {
    return await listCollectionDocuments(collectionId, extraQueries);
  } catch (error) {
    if (shouldDisableAppwriteCollectionRead(error)) {
      disableAppwriteCollectionRead(collectionId);
      return [];
    }

    throw error;
  }
}
