import {
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  updatePostVisibility,
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
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";
    const hidden = body.hidden !== false;

    if (!postId) {
      sendJson(response, 400, { error: "معرّف المنشور مطلوب." });
      return;
    }

    await updatePostVisibility(config, postId, hidden);

    await writeAdminAuditLog(config, {
      action: hidden ? "hide_post" : "unhide_post",
      targetId: postId,
      admin,
      details: hidden ? "إخفاء منشور" : "إظهار منشور",
    });

    sendJson(response, 200, {
      ok: true,
      postId,
      hidden,
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, message === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error: message.includes("attribute")
        ? "أضف حقل status أو isHidden في collection posts."
        : "تعذر تحديث ظهور المنشور.",
      code: message,
    });
  }
}
