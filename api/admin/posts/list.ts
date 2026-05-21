import { Databases, Query } from "node-appwrite";
import {
  createServerClient,
  handleOptions,
  readAdminConfig,
  requireAdminSession,
  readPostHidden,
  requireServerKey,
  sendJson,
} from "../../_lib/admin-shared";

export default async function handler(request: any, response: any) {
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
      authorId:
        typeof document.authorId === "string" ? document.authorId : "",
      createdAt:
        typeof document.$createdAt === "string" ? document.$createdAt : "",
      hidden: readPostHidden(document as Record<string, unknown>),
    }));

    sendJson(response, 200, { ok: true, posts });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, code === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error:
        code === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY لعرض المنشورات."
          : "تعذر تحميل المنشورات.",
      code,
    });
  }
}
