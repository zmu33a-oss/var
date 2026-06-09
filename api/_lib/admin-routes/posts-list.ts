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

    const url = new URL(request.url ?? "http://localhost", "http://localhost");
    const varId = url.searchParams.get("varId")?.trim() ?? "";
    const limitParam = Number.parseInt(
      url.searchParams.get("limit") ?? "25",
      10,
    );
    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : 25, 1),
      100,
    );

    const queries = [Query.orderDesc("$createdAt"), Query.limit(limit)];
    if (varId) {
      queries.unshift(Query.equal("varId", varId));
    }

    const databases = new Databases(createServerClient(config));
    const responseDocuments = await databases.listDocuments(
      config.databaseId,
      config.postsCollectionId,
      queries,
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

    sendJson(response, 200, {
      ok: true,
      posts,
      total: responseDocuments.total,
      limit,
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
