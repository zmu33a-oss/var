import { APPWRITE_CONFIG } from "./appwrite.config";

const DISABLED_APPWRITE_READ_COLLECTIONS_TTL_MS = 30 * 60 * 1000;

export let canReadProfileIndexCollection = true;
export let canWriteProfileIndexCollection = true;
export let canReadSocialInteractionsCollection = true;

const disabledAppwriteReadCollections = new Set<string>();
let hasHydratedDisabledAppwriteReadCollections = false;

export function setCanReadProfileIndexCollection(value: boolean) {
  canReadProfileIndexCollection = value;
}

export function setCanWriteProfileIndexCollection(value: boolean) {
  canWriteProfileIndexCollection = value;
}

export function setCanReadSocialInteractionsCollection(value: boolean) {
  canReadSocialInteractionsCollection = value;
}

// ─── Disabled collections storage ──────────────────────────────────────────

function getDisabledAppwriteReadCollectionsStorageKey() {
  const normalizedProjectId = APPWRITE_CONFIG.projectId.trim();
  const normalizedDatabaseId = APPWRITE_CONFIG.databaseId.trim();

  if (!normalizedProjectId || !normalizedDatabaseId) {
    return "";
  }

  return `webplus.appwrite-disabled-read-collections:${normalizedProjectId}:${normalizedDatabaseId}`;
}

function shouldPersistDisabledAppwriteReadCollection(collectionId: string) {
  const normalizedCollectionId = collectionId.trim();

  if (!normalizedCollectionId) {
    return false;
  }

  return (
    normalizedCollectionId !== APPWRITE_CONFIG.profilesCollectionId.trim() &&
    normalizedCollectionId !==
      APPWRITE_CONFIG.socialInteractionsCollectionId.trim()
  );
}

function hydrateDisabledAppwriteReadCollections() {
  if (
    hasHydratedDisabledAppwriteReadCollections ||
    typeof window === "undefined"
  ) {
    return;
  }

  hasHydratedDisabledAppwriteReadCollections = true;

  const storageKey = getDisabledAppwriteReadCollectionsStorageKey();

  if (!storageKey) {
    return;
  }

  try {
    const rawSnapshot = window.localStorage.getItem(storageKey);

    if (!rawSnapshot) {
      return;
    }

    const parsedSnapshot = JSON.parse(rawSnapshot) as {
      collectionIds?: unknown;
      savedAt?: unknown;
    } | null;
    const savedAt =
      typeof parsedSnapshot?.savedAt === "number" ? parsedSnapshot.savedAt : 0;

    if (
      !savedAt ||
      Date.now() - savedAt > DISABLED_APPWRITE_READ_COLLECTIONS_TTL_MS
    ) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    const collectionIds = Array.isArray(parsedSnapshot?.collectionIds)
      ? parsedSnapshot.collectionIds
      : [];

    for (const collectionId of collectionIds) {
      if (typeof collectionId !== "string") {
        continue;
      }

      const normalizedCollectionId = collectionId.trim();

      if (
        normalizedCollectionId &&
        shouldPersistDisabledAppwriteReadCollection(normalizedCollectionId)
      ) {
        disabledAppwriteReadCollections.add(normalizedCollectionId);
      }
    }
  } catch {
    // Ignore storage read failures and fall back to in-memory suppression.
  }
}

function persistDisabledAppwriteReadCollections() {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getDisabledAppwriteReadCollectionsStorageKey();

  if (!storageKey) {
    return;
  }

  try {
    const persistableCollectionIds = Array.from(
      disabledAppwriteReadCollections.values(),
    ).filter(shouldPersistDisabledAppwriteReadCollection);

    if (!persistableCollectionIds.length) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        collectionIds: persistableCollectionIds,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore storage write failures and keep the UI responsive.
  }
}

export function canAttemptAppwriteCollectionRead(collectionId: string) {
  hydrateDisabledAppwriteReadCollections();

  const normalizedCollectionId = collectionId.trim();

  return Boolean(
    APPWRITE_CONFIG.databaseId &&
    normalizedCollectionId &&
    !disabledAppwriteReadCollections.has(normalizedCollectionId),
  );
}

export function disableAppwriteCollectionRead(collectionId: string) {
  const normalizedCollectionId = collectionId.trim();

  if (!normalizedCollectionId) {
    return;
  }

  disabledAppwriteReadCollections.add(normalizedCollectionId);
  persistDisabledAppwriteReadCollections();
}

export function clearDisabledAppwriteCollectionRead(collectionId: string) {
  const normalizedCollectionId = collectionId.trim();

  if (!normalizedCollectionId) {
    return;
  }

  if (disabledAppwriteReadCollections.delete(normalizedCollectionId)) {
    persistDisabledAppwriteReadCollections();
  }
}

export function restoreProfileIndexReadCapability() {
  clearDisabledAppwriteCollectionRead(APPWRITE_CONFIG.profilesCollectionId);
  canReadProfileIndexCollection = true;
}

export function restoreSocialInteractionsReadCapability() {
  clearDisabledAppwriteCollectionRead(
    APPWRITE_CONFIG.socialInteractionsCollectionId,
  );
  canReadSocialInteractionsCollection = true;
}
