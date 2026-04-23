import { useEffect, useMemo, useState } from "react";
import { fetchPublicVerifiedUsers, type VerifiedUserRecord } from "./adminApi";
import { normalizeVerificationBadge } from "./verificationBadges";

const VERIFIED_USERS_STORAGE_KEY = "webplus:verified-users";
export const VERIFIED_USERS_EVENT = "webplus:verified-users-updated";

let pendingVerificationRequest: Promise<VerifiedUserRecord[]> | null = null;

function normalizeVerifiedUsers(value: unknown): VerifiedUserRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (entry): entry is VerifiedUserRecord =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as VerifiedUserRecord).userId === "string" &&
        (entry as VerifiedUserRecord).userId.trim().length > 0,
    )
    .map((entry) => ({
      userId: entry.userId,
      badge: normalizeVerificationBadge(entry.badge),
      updatedAt: entry.updatedAt,
      updatedBy: entry.updatedBy,
    }));
}

export function readVerifiedUsersCache() {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(VERIFIED_USERS_STORAGE_KEY);
    if (!rawValue) return [];

    return normalizeVerifiedUsers(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function syncVerifiedUsersCache(records: VerifiedUserRecord[]) {
  const nextRecords = normalizeVerifiedUsers(records);

  if (typeof window === "undefined") {
    return nextRecords;
  }

  window.localStorage.setItem(
    VERIFIED_USERS_STORAGE_KEY,
    JSON.stringify(nextRecords),
  );
  window.dispatchEvent(new CustomEvent(VERIFIED_USERS_EVENT));
  return nextRecords;
}

async function requestVerifiedUsers() {
  try {
    const nextRecords = await fetchPublicVerifiedUsers();
    return syncVerifiedUsersCache(nextRecords);
  } catch {
    return readVerifiedUsersCache();
  }
}

export async function loadVerifiedUsers(force = false) {
  const cachedRecords = readVerifiedUsersCache();

  if (!force && cachedRecords.length > 0) {
    if (!pendingVerificationRequest) {
      pendingVerificationRequest = requestVerifiedUsers().finally(() => {
        pendingVerificationRequest = null;
      });
    }

    return cachedRecords;
  }

  if (!pendingVerificationRequest) {
    pendingVerificationRequest = requestVerifiedUsers().finally(() => {
      pendingVerificationRequest = null;
    });
  }

  return pendingVerificationRequest;
}

export function useVerificationRegistry() {
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUserRecord[]>(() =>
    readVerifiedUsersCache(),
  );

  useEffect(() => {
    let isMounted = true;

    void loadVerifiedUsers().then((nextRecords) => {
      if (isMounted) {
        setVerifiedUsers(nextRecords);
      }
    });

    if (typeof window === "undefined") {
      return () => {
        isMounted = false;
      };
    }

    const handleVerificationSync = () => {
      setVerifiedUsers(readVerifiedUsersCache());
    };

    window.addEventListener(VERIFIED_USERS_EVENT, handleVerificationSync);

    return () => {
      isMounted = false;
      window.removeEventListener(VERIFIED_USERS_EVENT, handleVerificationSync);
    };
  }, []);

  const verificationByUserId = useMemo(
    () => new Map(verifiedUsers.map((entry) => [entry.userId, entry])),
    [verifiedUsers],
  );

  return {
    verifiedUsers,
    verificationByUserId,
    getVerification: (userId?: string | null) =>
      userId ? (verificationByUserId.get(userId) ?? null) : null,
    isVerified: (userId?: string | null) =>
      Boolean(userId && verificationByUserId.has(userId)),
    refresh: async () => {
      const nextRecords = await loadVerifiedUsers(true);
      setVerifiedUsers(nextRecords);
      return nextRecords;
    },
  };
}
