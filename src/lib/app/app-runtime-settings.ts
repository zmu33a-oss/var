import { IS_WEB_RUNTIME } from "../appwrite/appwrite.client";
import type { HomeMode } from "../../app.types";

export type AppRuntimeSettings = {
  uiMode: HomeMode;
  richIconsEnabled: boolean;
  gpuAccelerationEnabled: boolean;
  updatedAt: string;
};

const DEFAULT_SETTINGS: AppRuntimeSettings = {
  uiMode: "tiktok",
  richIconsEnabled: true,
  gpuAccelerationEnabled: true,
  updatedAt: "",
};

export function resolvePublicApiBase() {
  const configured =
    process.env.EXPO_PUBLIC_ADMIN_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_APP_URL?.trim() ||
    "";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (IS_WEB_RUNTIME && typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const expoDevPorts = new Set(["8081", "5174", "19006", "8082"]);

    if (expoDevPorts.has(port)) {
      return `${protocol}//${hostname}:3000`;
    }

    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  }

  const productionFallback =
    process.env.EXPO_PUBLIC_VERCEL_URL?.trim() ||
    "https://var-gold.vercel.app";

  return productionFallback.replace(/\/+$/, "");
}

function normalizeHomeMode(value: unknown): HomeMode {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return raw === "x" || raw === "x-mode" ? "x" : "tiktok";
}

function readBool(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return fallback;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAppRuntimeSettings(): Promise<AppRuntimeSettings> {
  try {
    const response = await fetchWithTimeout(
      `${resolvePublicApiBase()}/api/app/settings`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      settings?: Record<string, unknown>;
    };

    if (!response.ok || !payload.settings) {
      return { ...DEFAULT_SETTINGS };
    }

    const settings = payload.settings;

    return {
      uiMode: normalizeHomeMode(settings.uiMode),
      richIconsEnabled: readBool(settings.richIconsEnabled, true),
      gpuAccelerationEnabled: readBool(settings.gpuAccelerationEnabled, true),
      updatedAt:
        typeof settings.updatedAt === "string" ? settings.updatedAt : "",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
