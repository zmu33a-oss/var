import {
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  updateAdminCommentVisibility,
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
    const commentId =
      typeof body.commentId === "string" ? body.commentId.trim() : "";
    const hidden = body.hidden !== false;
    const source = typeof body.source === "string" ? body.source.trim() : "";

    if (!commentId) {
      sendJson(response, 400, { error: "معرّف التعليق مطلوب." });
      return;
    }

    await updateAdminCommentVisibility(config, {
      commentId,
      hidden,
      source: source || undefined,
    });

    await writeAdminAuditLog(config, {
      action: hidden ? "hide_comment" : "unhide_comment",
      targetId: commentId,
      admin,
      details: hidden ? "إخفاء تعليق" : "إظهار تعليق",
    });

    sendJson(response, 200, {
      ok: true,
      commentId,
      hidden,
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, message === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error:
        message === "MISSING_COMMENTS_COLLECTION"
          ? "فعّل socialinteractions أو comments collection."
          : message.includes("attribute")
            ? "أضف حقل active (boolean) في collection التعليقات."
            : "تعذر تحديث التعليق.",
      code: message,
    });
  }
}
