import {
  createAdminKey,
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
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const role = typeof body.role === "string" ? body.role : "";
    const expiryOption =
      typeof body.expiryOption === "string" ? body.expiryOption : "Never";
    const customDate =
      typeof body.customDate === "string" ? body.customDate.trim() : "";

    if (!label) {
      sendJson(response, 400, {
        ok: false,
        error: "أدخل اسم أو بادئة للمفتاح.",
        code: "MISSING_LABEL",
      });
      return;
    }

    const created = await createAdminKey(config, {
      label,
      role,
      expiryOption,
      customDate,
      admin,
    });

    await writeAdminAuditLog(config, {
      action: "create_admin_key",
      targetId: created.key.keyPreview,
      admin,
      details: `${created.key.label} · ${created.key.roleLabel}`,
    });

    sendJson(response, 200, {
      ok: true,
      key: created.key,
      secret: created.secret,
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
            : code === "MISSING_LABEL" ||
                code === "MISSING_CUSTOM_DATE" ||
                code === "INVALID_CUSTOM_DATE"
              ? 400
              : 500;

    sendJson(response, status, {
      ok: false,
      error:
        code === "MISSING_CUSTOM_DATE"
          ? "حدد تاريخ انتهاء مخصص."
          : code === "INVALID_CUSTOM_DATE"
            ? "تاريخ الانتهاء غير صالح."
            : code === "MISSING_API_KEY"
              ? "أضف APPWRITE_API_KEY لإنشاء المفاتيح."
              : code === "MISSING_SESSION"
                ? "الجلسة منتهية، أعد تسجيل الدخول."
                : code === "NOT_ADMIN"
                  ? "هذا الحساب ليس لديه صلاحية أدمن."
                  : "تعذر إنشاء مفتاح الأدمن.",
      code,
    });
  }
}
