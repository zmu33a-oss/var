import {
  handleOptions,
  normalizeAppUiMode,
  readAdminConfig,
  readBoolField,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  updateAppRuntimeSettings,
  writeAdminAuditLog,
} from "../admin-shared.js";

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "POST") !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  try {
    const admin = await requireAdminSession(request, config);
    requireServerKey(config);

    const body = readJsonBody(request);
    const patch: {
      uiMode?: ReturnType<typeof normalizeAppUiMode>;
      richIconsEnabled?: boolean;
      gpuAccelerationEnabled?: boolean;
      admin: typeof admin;
    } = { admin };

    if (typeof body.uiMode === "string" && body.uiMode.trim()) {
      patch.uiMode = normalizeAppUiMode(body.uiMode);
    }

    if (typeof body.richIconsEnabled !== "undefined") {
      patch.richIconsEnabled = readBoolField(body.richIconsEnabled);
    }

    if (typeof body.gpuAccelerationEnabled !== "undefined") {
      patch.gpuAccelerationEnabled = readBoolField(body.gpuAccelerationEnabled);
    }

    const settings = await updateAppRuntimeSettings(config, patch);

    await writeAdminAuditLog(config, {
      action: "update_app_settings",
      targetId: "global",
      admin,
      details: `uiMode=${settings.uiMode}`,
    });

    sendJson(response, 200, {
      ok: true,
      settings,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "MISSING_SESSION"
        ? 401
        : code === "NOT_ADMIN"
          ? 403
          : code === "MISSING_API_KEY"
            ? 503
            : 500;

    sendJson(response, status, {
      ok: false,
      error:
        code === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY لتحديث إعدادات التطبيق."
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر حفظ إعدادات التطبيق.",
      code,
    });
  }
}
