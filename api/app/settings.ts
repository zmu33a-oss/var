import {
  handleOptions,
  readAdminConfig,
  readAppRuntimeSettings,
  sendJson,
} from "../_lib/admin-shared.js";

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
    const settings = await readAppRuntimeSettings(config);

    sendJson(response, 200, {
      ok: true,
      settings: {
        uiMode: settings.uiMode,
        richIconsEnabled: settings.richIconsEnabled,
        gpuAccelerationEnabled: settings.gpuAccelerationEnabled,
        updatedAt: settings.updatedAt,
      },
    });
  } catch {
    sendJson(response, 200, {
      ok: true,
      settings: {
        uiMode: "x",
        richIconsEnabled: true,
        gpuAccelerationEnabled: true,
        updatedAt: "",
      },
    });
  }
}
