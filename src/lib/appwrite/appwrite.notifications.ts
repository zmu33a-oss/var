/**
 * Notification persistence via the social_interactions collection.
 *
 * We store notification records using:
 *   mode:     "x-notification"
 *   action:   the notification type ("dm" | "reply" | "engagement" | "activity")
 *   varId:    the receiving user's VAR ID
 *   targetId: the source VAR ID (sender / post author)
 *   value:    JSON string of { title, body, timeLabel }
 */

import { APPWRITE_CONFIG } from "./appwrite.config";
import { syncAppwriteSocialInteraction } from "./appwrite.social";
import {
  listCollectionDocumentsSafely,
  AppwriteQuery,
  hasConfiguredCollection,
} from "./appwrite.client";
import {
  normalizeAppwriteVarId,
  isPermissionDeniedAppwriteError,
} from "./appwrite.helpers";
import type { XNotificationEntry } from "../../screens/x-feed/x-feed.types";

const NOTIFICATION_MODE = "x-notification";
const MAX_STORED = 60;

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveAppwriteNotification(
  varId: string,
  notification: XNotificationEntry,
): Promise<void> {
  const normalizedVarId = normalizeAppwriteVarId(varId);
  if (!normalizedVarId) return;

  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId)
  ) {
    return;
  }

  try {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      timeLabel: notification.timeLabel,
      iconName: notification.iconName,
      accentColor: notification.accentColor,
      sortOrder: notification.sortOrder,
      target: notification.target ?? null,
    });

    await syncAppwriteSocialInteraction({
      varId: normalizedVarId,
      mode: "notification",
      action: "notify",
      targetId: notification.avatarUri || normalizedVarId,
      value: payload,
    });
  } catch {
    // Silently ignore persistence failures
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadAppwriteNotifications(
  varId: string,
): Promise<XNotificationEntry[]> {
  const normalizedVarId = normalizeAppwriteVarId(varId);
  if (!normalizedVarId) return [];

  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId)
  ) {
    return [];
  }

  try {
    const documents = await listCollectionDocumentsSafely(
      APPWRITE_CONFIG.socialInteractionsCollectionId,
      [
        AppwriteQuery.equal("mode", NOTIFICATION_MODE),
        AppwriteQuery.equal("varId", normalizedVarId),
        AppwriteQuery.orderDesc("$createdAt"),
        AppwriteQuery.limit(MAX_STORED),
      ],
    );

    return documents
      .map((doc) => {
        const d = doc as Record<string, unknown>;
        const rawValue = typeof d.value === "string" ? d.value : "";
        const id =
          typeof d.$id === "string" ? `persisted-${d.$id}` : `persisted-${Math.random()}`;

        try {
          const parsed = JSON.parse(rawValue) as Partial<XNotificationEntry>;
          return {
            id: parsed.id ?? id,
            title: parsed.title ?? "إشعار",
            body: parsed.body ?? "",
            timeLabel: parsed.timeLabel ?? "",
            iconName:
              (parsed.iconName as XNotificationEntry["iconName"]) ??
              "notifications-outline",
            accentColor: parsed.accentColor ?? "#FFFFFF",
            avatarUri: parsed.avatarUri ?? "",
            verified: parsed.verified ?? false,
            sortOrder: parsed.sortOrder ?? 0,
            target: parsed.target ?? undefined,
          } satisfies XNotificationEntry;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as XNotificationEntry[];
  } catch (error) {
    if (isPermissionDeniedAppwriteError(error)) return [];
    throw error;
  }
}

// ─── Bulk save helpers ────────────────────────────────────────────────────────

const _savedNotificationIds = new Set<string>();

export function isNotificationAlreadySaved(notificationId: string): boolean {
  return _savedNotificationIds.has(notificationId);
}

export function markNotificationSaved(notificationId: string): void {
  _savedNotificationIds.add(notificationId);
}
