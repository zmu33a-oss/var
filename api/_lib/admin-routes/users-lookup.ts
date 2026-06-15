import { Databases, Query } from "node-appwrite";
import {
  createServerClient,
  findProfileSmart,
  handleOptions,
  readAdminConfig,
  readAccountStatus,
  readBoolField,
  readCardTierField,
  requireAdminSession,
  requireServerKey,
  sendJson,
} from "../admin-shared";

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
    const rawQuery =
      url.searchParams.get("displayVarId") ?? url.searchParams.get("q") ?? "";

    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) {
      sendJson(response, 400, {
        error: "أدخل رقم VAR، اسم المستخدم، أو الاسم الكامل للبحث.",
      });
      return;
    }

    const profile = await findProfileSmart(config, trimmedQuery);
    if (!profile) {
      sendJson(response, 404, {
        error: `لم يتم العثور على حساب يطابق "${trimmedQuery}". تحقق من الرقم أو جرّب اسم المستخدم.`,
      });
      return;
    }

    const varId = typeof profile.varId === "string" ? profile.varId : "";
    let postsCount = 0;

    if (varId && config.databaseId) {
      try {
        const databases = new Databases(createServerClient(config));
        const posts = await databases.listDocuments(
          config.databaseId,
          config.postsCollectionId,
          [Query.equal("varId", varId), Query.limit(100)],
        );
        postsCount = posts.total;
      } catch {
        postsCount = 0;
      }
    }

    sendJson(response, 200, {
      ok: true,
      user: {
        id: typeof profile.$id === "string" ? profile.$id : "",
        userId:
          typeof profile.userId === "string"
            ? profile.userId
            : typeof profile.$id === "string"
              ? profile.$id
              : "",
        displayName:
          typeof profile.displayName === "string" ? profile.displayName : "",
        username: typeof profile.username === "string" ? profile.username : "",
        displayVarId:
          typeof profile.displayVarId === "string" ? profile.displayVarId : "",
        varId,
        role: typeof profile.role === "string" ? profile.role : "member",
        verified: readBoolField(profile.isVerified),
        cardTier: readCardTierField(profile.cardTier),
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
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر البحث عن المستخدم.",
      code,
    });
  }
}
