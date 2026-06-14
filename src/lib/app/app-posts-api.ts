import {
  applyAppwriteAuthHeaders,
  readAppwriteAuthHeadersAsync,
} from "./app-api-auth";
import { resolvePublicApiBase } from "./app-runtime-settings";

export class AppPostsApiError extends Error {
  code: string;

  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.code = code;
  }
}

export async function deletePostViaAppApi(postId: string): Promise<void> {
  const trimmedPostId = postId.trim();

  if (!trimmedPostId) {
    throw new AppPostsApiError("معرّف المنشور مطلوب.", "MISSING_POST_ID");
  }

  const auth = await readAppwriteAuthHeadersAsync();

  if (!auth.session && !auth.jwt) {
    throw new AppPostsApiError(
      "سجّل الدخول ثم أعد المحاولة.",
      "MISSING_SESSION",
    );
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });
  applyAppwriteAuthHeaders(headers, auth);

  const response = await fetch(`${resolvePublicApiBase()}/api/app/posts-delete`, {
    method: "POST",
    headers,
    body: JSON.stringify({ postId: trimmedPostId }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    code?: string;
  };

  if (!response.ok || payload.ok === false) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : `تعذر حذف المنشور (${response.status}).`;
    const code =
      typeof payload.code === "string" ? payload.code : String(response.status);

    throw new AppPostsApiError(message, code);
  }
}
