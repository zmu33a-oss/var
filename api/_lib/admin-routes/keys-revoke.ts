import {
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  setAdminKeyStatus,
  writeAdminAuditLog,
} from "../admin-shared";

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
    const keyId = typeof body.keyId === "string" ? body.keyId.trim() : "";
    const nextStatus =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : "";

    if (!keyId) {
      sendJson(response, 400, {
        ok: false,
        error: "معرّف المفتاح مطلوب.",
        code: "MISSING_KEY_ID",
      });
      return;
    }

    const status = nextStatus === "active" ? "active" : "revoked";
    const key = await setAdminKeyStatus(config, keyId, status);

    await writeAdminAuditLog(config, {
      action: status === "active" ? "activate_admin_key" : "revoke_admin_key",
      targetId: key.keyPreview,
      admin,
      details: `${key.label} · ${status}`,
    });

    sendJson(response, 200, {
      ok: true,
      key,
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
          ? "أضف APPWRITE_API_KEY لتحديث المفاتيح."
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر تحديث حالة المفتاح.",
      code,
    });
  }
}
