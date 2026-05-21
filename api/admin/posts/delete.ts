import { Databases } from "node-appwrite";
import {
  createServerClient,
  handleOptions,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  writeAdminAuditLog,
} from "../../_lib/admin-shared";

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
    const admin = await requireAdminSession(request, config);
    requireServerKey(config);

    const body = readJsonBody(request);
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";

    if (!postId) {
      sendJson(response, 400, { error: "معرّف المنشور مطلوب." });
      return;
    }

    const databases = new Databases(createServerClient(config));
    await databases.deleteDocument(
      config.databaseId,
      config.postsCollectionId,
      postId,
    );

    await writeAdminAuditLog(config, {
      action: "delete_post",
      targetId: postId,
      admin,
      details: "حذف منشور",
    });

    sendJson(response, 200, {
      ok: true,
      postId,
      by: admin.email,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, code === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error:
        code === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY لحذف المنشورات."
          : "تعذر حذف المنشور.",
      code,
    });
  }
}
