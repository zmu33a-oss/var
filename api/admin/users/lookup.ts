import { Databases, Query } from "node-appwrite";
import {
  createServerClient,
  findProfileByDisplayVarId,
  handleOptions,
  normalizeDisplayVarId,
  readAdminConfig,
  readAccountStatus,
  readBoolField,
  requireAdminSession,
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

    const url = new URL(request.url ?? "http://localhost", "http://localhost");
    const displayVarId = url.searchParams.get("displayVarId") ?? "";

    if (!normalizeDisplayVarId(displayVarId)) {
      sendJson(response, 400, { error: "أدخل رقم VAR الظاهر بصيغة صحيحة." });
      return;
    }

    const profile = await findProfileByDisplayVarId(config, displayVarId);
    if (!profile) {
      sendJson(response, 404, { error: "لم يتم العثور على حساب بهذا الرقم." });
      return;
    }

    const varId =
      typeof profile.varId === "string" ? profile.varId : "";
    let postsCount = 0;

    if (varId && config.databaseId) {
      const databases = new Databases(createServerClient(config));
      const posts = await databases.listDocuments(
        config.databaseId,
        config.postsCollectionId,
        [Query.equal("varId", varId), Query.limit(100)],
      );
      postsCount = posts.total;
    }

    sendJson(response, 200, {
      ok: true,
      user: {
        id: profile.$id,
        userId:
          typeof profile.userId === "string" ? profile.userId : profile.$id,
        displayName:
          typeof profile.displayName === "string" ? profile.displayName : "",
        username:
          typeof profile.username === "string" ? profile.username : "",
        displayVarId:
          typeof profile.displayVarId === "string"
            ? profile.displayVarId
            : "",
        varId,
        role: typeof profile.role === "string" ? profile.role : "member",
        verified: readBoolField(profile.isVerified),
        accountStatus: readAccountStatus(profile.accountStatus),
        postsCount,
      },
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
          ? "أضف APPWRITE_API_KEY في Vercel لقراءة المستخدمين."
          : "تعذر البحث عن المستخدم.",
      code,
    });
  }
}
