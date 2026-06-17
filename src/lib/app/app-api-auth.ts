import { readWebAppwriteSessionSecret } from "../../appshell/appshell.helpers";
import { getAccountBridge } from "../appwrite/appwrite.client";

export type AppwriteAuthHeaders = {
  session?: string;
  jwt?: string;
};

async function readAppwriteJwtAsync() {
  try {
    const account = getAccountBridge() as {
      createJWT?: () => Promise<{ jwt?: string }>;
    };

    if (!account.createJWT) {
      return "";
    }

    const response = await account.createJWT();
    return typeof response.jwt === "string" ? response.jwt.trim() : "";
  } catch {
    return "";
  }
}

export async function readAppwriteAuthHeadersAsync(): Promise<AppwriteAuthHeaders> {
  const session = readWebAppwriteSessionSecret();

  if (session) {
    return { session };
  }

  try {
    const account = getAccountBridge() as {
      listSessions?: () => Promise<{
        sessions?: Array<{ secret?: string; current?: boolean }>;
      }>;
      createJWT?: () => Promise<{ jwt?: string }>;
    };

    if (account.listSessions) {
      const response = await account.listSessions();
      const sessions = response.sessions ?? [];
      const currentSession =
        sessions.find((item) => item.current) ?? sessions[0];
      const sessionSecret = currentSession?.secret?.trim() || "";

      if (sessionSecret) {
        return { session: sessionSecret };
      }
    }
  } catch {
    // Fall through to JWT.
  }

  const jwt = await readAppwriteJwtAsync();

  if (jwt) {
    return { jwt };
  }

  return {};
}

export function applyAppwriteAuthHeaders(
  headers: Headers,
  auth: AppwriteAuthHeaders,
) {
  if (auth.jwt) {
    headers.set("X-Appwrite-JWT", auth.jwt);
    return;
  }

  if (auth.session) {
    headers.set("X-Appwrite-Session", auth.session);
  }
}
