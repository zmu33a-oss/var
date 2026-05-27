import {
  handleOptions,
  listAdminProfiles,
  readAccountStatus,
  readAdminConfig,
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
    const search = url.searchParams.get("search")?.trim() ?? "";
    const limitParam = Number.parseInt(
      url.searchParams.get("limit") ?? "25",
      10,
    );
    const offsetParam = Number.parseInt(
      url.searchParams.get("offset") ?? "0",
      10,
    );

    const { profiles, total } = await listAdminProfiles(config, {
      search,
      limit: Number.isFinite(limitParam) ? limitParam : 25,
      offset: Number.isFinite(offsetParam) ? offsetParam : 0,
    });

    const users = profiles.map((profile) => ({
      id: typeof profile.$id === "string" ? profile.$id : "",
      userId:
        typeof profile.userId === "string"
          ? profile.userId
          : typeof profile.$id === "string"
            ? profile.$id
            : "",
      displayName:
        typeof profile.displayName === "string" ? profile.displayName : "",
      username:
        typeof profile.username === "string" ? profile.username : "",
      displayVarId:
        typeof profile.displayVarId === "string" ? profile.displayVarId : "",
      varId: typeof profile.varId === "string" ? profile.varId : "",
      role: typeof profile.role === "string" ? profile.role : "member",
      verified: readBoolField(profile.isVerified),
      cardTier: readCardTierField(profile.cardTier),
      accountStatus: readAccountStatus(profile.accountStatus),
      avatarUrl:
        typeof profile.avatarUrl === "string"
          ? profile.avatarUrl
          : typeof profile.avatarUri === "string"
            ? profile.avatarUri
            : "",
      createdAt:
        typeof profile.$createdAt === "string" ? profile.$createdAt : "",
    }));

    sendJson(response, 200, {
      ok: true,
      users,
      total,
      limit: Number.isFinite(limitParam) ? limitParam : 25,
      offset: Number.isFinite(offsetParam) ? offsetParam : 0,
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
              : "تعذر جلب قائمة المستخدمين.",
      code,
    });
  }
}
