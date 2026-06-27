import {
  createAdminJwtForUser,
  createEmailSession,
  createJwtForSession,
  handleOptions,
  mapLoginError,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  sendJson,
} from "../admin-shared";

function buildAuthHeader(token: string) {
  return token.startsWith("eyJ")
    ? { "x-appwrite-jwt": token }
    : { "x-appwrite-session": token };
}

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "GET") !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  let body: Record<string, unknown>;
  try {
    body = readJsonBody(request);
  } catch {
    sendJson(response, 400, {
      ok: false,
      error: "تعذر قراءة بيانات الطلب.",
      code: "INVALID_BODY",
    });
    return;
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    sendJson(response, 400, {
      ok: false,
      error: "أدخل البريد وكلمة المرور.",
      code: "MISSING_CREDENTIALS",
    });
    return;
  }

  try {
    const session = await createEmailSession(config, email, password);
    const sessionId = typeof session.$id === "string" ? session.$id.trim() : "";
    const userId =
      typeof session.userId === "string" ? session.userId.trim() : "";
    const sessionSecret =
      typeof session.secret === "string" ? session.secret.trim() : "";

    if (!sessionId || !userId) {
      throw new Error("MISSING_SESSION");
    }

    const authToken = sessionSecret
      ? sessionSecret
      : await createAdminJwtForUser(config, userId, sessionId);

    const admin = await requireAdminSession(
      { headers: buildAuthHeader(authToken) },
      config,
    );

    sendJson(response, 200, {
      ok: true,
      token: authToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    const mapped = mapLoginError(error);
    sendJson(response, mapped.status, {
      ok: false,
      error: mapped.error,
      code: mapped.code,
    });
  }
}
