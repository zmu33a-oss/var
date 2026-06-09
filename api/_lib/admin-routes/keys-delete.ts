import {
  deleteAdminKey,
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
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
    const keyId = typeof body.keyId === "string" ? body.keyId.trim() : "";
    const keyPreview =
      typeof body.keyPreview === "string" ? body.keyPreview.trim() : keyId;

    if (!keyId) {
      sendJson(response, 400, {
        ok: false,
        error: "معرّف المفتاح مطلوب.",
        code: "MISSING_KEY_ID",
      });
      return;
    }

    await deleteAdminKey(config, keyId);

    await writeAdminAuditLog(config, {
      action: "delete_admin_key",
      targetId: keyPreview,
      admin,
      details: "حذف مفتاح أدمن",
    });

    sendJson(response, 200, {
      ok: true,
      keyId,
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
          ? "أضف APPWRITE_API_KEY لحذف المفاتيح."
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر حذف المفتاح.",
      code,
    });
  }
}
