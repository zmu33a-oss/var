import { Databases, Query } from "node-appwrite";
import {
  createServerClient,
  handleOptions,
  readAdminConfig,
  requireAdminSession,
  readPostHidden,
  requireServerKey,
  sendJson,
} from "../admin-shared.js";

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "GET") !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  try {
    await requireAdminSession(request, config);
    requireServerKey(config);

    const databases = new Databases(createServerClient(config));
    const responseDocuments = await databases.listDocuments(
      config.databaseId,
      config.postsCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(25)],
    );

    const posts = responseDocuments.documents.map((document) => ({
      id: document.$id,
      title: typeof document.title === "string" ? document.title : "",
      content: typeof document.content === "string" ? document.content : "",
      varId: typeof document.varId === "string" ? document.varId : "",
      authorId: typeof document.authorId === "string" ? document.authorId : "",
      createdAt:
        typeof document.$createdAt === "string" ? document.$createdAt : "",
      hidden: readPostHidden(document as Record<string, unknown>),
    }));

    sendJson(response, 200, { ok: true, posts });
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
          ? "أضف APPWRITE_API_KEY لعرض المنشورات."
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر تحميل المنشورات.",
      code,
    });
  }
}
