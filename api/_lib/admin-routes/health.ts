import {
  handleOptions,
  readAdminConfig,
  readAdminHealthSnapshot,
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
    const snapshot = await readAdminHealthSnapshot(config);

    sendJson(response, 200, {
      ok: snapshot.ok,
      writesEnabled: snapshot.writesEnabled,
      missing: snapshot.missing,
      collections: snapshot.collections,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      writesEnabled: false,
      missing: ["health_probe_failed"],
      collections: [],
      error: error instanceof Error ? error.message : "UNKNOWN",
    });
  }
}
