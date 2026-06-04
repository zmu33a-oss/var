import {
  handleOptions,
  migrateMissingCardTiersToClassic,
  readAdminConfig,
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

    const migrated = await migrateMissingCardTiersToClassic(config);

    await writeAdminAuditLog(config, {
      action: "migrate_card_tiers",
      targetId: "profiles",
      admin,
      details: `تطبيق بطاقة classic على ${migrated} حساب`,
    });

    sendJson(response, 200, {
      ok: true,
      migrated,
      cardTier: "classic",
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      message === "MISSING_SESSION"
        ? 401
        : message === "NOT_ADMIN"
          ? 403
          : message === "MISSING_API_KEY"
            ? 503
            : 500;

    sendJson(response, status, {
      ok: false,
      error:
        message === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY في Vercel لتطبيق البطاقة الافتراضية."
          : message.includes("attribute")
            ? "أضف حقل cardTier (string) في collection profiles داخل Appwrite."
            : "تعذر تطبيق البطاقة الافتراضية.",
      code: message,
    });
  }
}
