import {
  deleteOwnedPost,
  handleOptions,
  mapAppPostDeleteError,
  readAdminConfig,
  readJsonBody,
  requireAppUserSession,
  sendJson,
} from "../_lib/admin-shared.js";

export default async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "POST") !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  try {
    const user = await requireAppUserSession(request, config);
    const body = readJsonBody(request);
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";

    if (!postId) {
      sendJson(response, 400, {
        ok: false,
        code: "MISSING_POST_ID",
        error: "معرّف المنشور مطلوب.",
      });
      return;
    }

    const deletedPostId = await deleteOwnedPost(config, postId, user);

    sendJson(response, 200, {
      ok: true,
      postId: deletedPostId,
    });
  } catch (error) {
    const mapped = mapAppPostDeleteError(error);

    sendJson(response, mapped.status, {
      ok: false,
      code: mapped.code,
      error: mapped.error,
    });
  }
}
