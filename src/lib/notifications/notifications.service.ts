/**
 * Cross-platform notification service.
 *
 * Web  → browser Notification API
 * iOS/Android → expo-notifications (local notifications)
 */

import { Platform } from "react-native";

let _permissionGranted = false;

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return false;
      }
      if (Notification.permission === "granted") {
        _permissionGranted = true;
        return true;
      }
      if (Notification.permission === "denied") return false;
      const result = await Notification.requestPermission();
      _permissionGranted = result === "granted";
      return _permissionGranted;
    }

    // Native — expo-notifications
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    const { status } = await Notifications.requestPermissionsAsync();
    _permissionGranted = status === "granted";
    return _permissionGranted;
  } catch {
    return false;
  }
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function showMessageNotification(
  senderName: string,
  messageBody: string,
): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      new Notification(`رسالة من ${senderName}`, {
        body: messageBody,
        icon: "/favicon.ico",
        dir: "rtl",
        lang: "ar",
        tag: `dm-${senderName}`,
      });
      return;
    }

    // Native
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `رسالة من ${senderName}`,
        body: messageBody,
        sound: true,
        data: { type: "dm", sender: senderName },
      },
      trigger: null,
    });
  } catch {
    // Silently ignore notification failures — don't block the messaging flow
  }
}

export async function showGenericNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        dir: "rtl",
        lang: "ar",
      });
      return;
    }

    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data: data ?? {} },
      trigger: null,
    });
  } catch {
    // Silently ignore
  }
}

export { _permissionGranted };
