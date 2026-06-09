import {
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  reviewAdminReport,
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
    const reportId =
      typeof body.reportId === "string" ? body.reportId.trim() : "";
    const legacy = body.legacy === true;
    const statusValue =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    const status = statusValue === "resolved" ? "resolved" : "dismissed";
    const hidePost = body.hidePost === true;

    if (!reportId) {
      sendJson(response, 400, {
        ok: false,
        error: "معرّف البلاغ مطلوب.",
      });
      return;
    }

    const result = await reviewAdminReport(config, {
      reportId,
      legacy,
      status,
      hidePost,
    });

    await writeAdminAuditLog(config, {
      action: status === "resolved" ? "resolve_report" : "dismiss_report",
      targetId: reportId,
      admin,
      details: hidePost ? "تمت المراجعة مع إخفاء المنشور" : "تمت مراجعة البلاغ",
    });

    sendJson(response, 200, {
      ok: true,
      ...result,
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
            : message === "MISSING_REPORTS_COLLECTION"
              ? 503
              : 500;

    sendJson(response, status, {
      ok: false,
      error:
        message === "MISSING_REPORTS_COLLECTION"
          ? "أنشئ collection باسم reports أو فعّل APPWRITE_REPORTS_COLLECTION_ID."
          : "تعذر مراجعة البلاغ.",
      code: message,
    });
  }
}
