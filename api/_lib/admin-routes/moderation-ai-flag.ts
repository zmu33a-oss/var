import {
  flagAdminPostForModeration,
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
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
    const aiFlags =
      typeof body.aiFlags === "string" ? body.aiFlags.trim() : "ai_review";
    const aiScore =
      typeof body.aiScore === "number"
        ? body.aiScore
        : Number.parseFloat(String(body.aiScore ?? "85"));

    if (!postId) {
      sendJson(response, 400, {
        ok: false,
        error: "معرّف المنشور مطلوب.",
      });
      return;
    }

    const result = await flagAdminPostForModeration(config, {
      postId,
      aiScore: Number.isFinite(aiScore) ? aiScore : 85,
      aiFlags,
      moderationStatus: "flagged",
    });

    await writeAdminAuditLog(config, {
      action: "ai_flag_post",
      targetId: postId,
      admin,
      details: `AI score ${result.aiScore} · ${result.aiFlags}`,
    });

    sendJson(response, 200, {
      ok: true,
      ...result,
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, message === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error: "تعذر وسم المنشور كمحتوى مشبوه.",
      code: message,
    });
  }
}
