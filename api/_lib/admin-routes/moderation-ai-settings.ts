import { readAiModerationSettings } from "../ai-moderation.js";
import {
  handleOptions,
  readAdminConfig,
  requireAdminSession,
  sendJson,
} from "../admin-shared";

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "GET") !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  try {
    await requireAdminSession(request, config);
    const settings = readAiModerationSettings();

    sendJson(response, 200, {
      ok: true,
      settings: {
        enabled: settings.enabled,
        threshold: settings.threshold,
        autoHideThreshold: settings.autoHideThreshold,
        webhookConfigured: settings.webhookConfigured,
        keywordCount: settings.keywordCount,
        keywordsPreview: settings.keywords,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "MISSING_SESSION"
        ? 401
        : code === "NOT_ADMIN"
          ? 403
          : 500;

    sendJson(response, status, {
      ok: false,
      error: "تعذر قراءة إعدادات AI.",
      code,
    });
  }
}
