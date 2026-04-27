import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const app = require("../src/server.cjs");

export default function handler(request, response) {
  const routePath = request.query?.path;

  if (routePath) {
    const joinedPath = Array.isArray(routePath)
      ? routePath.join("/")
      : String(routePath);
    const requestUrl = new URL(request.url, "http://localhost");

    requestUrl.searchParams.delete("path");
    request.url = `/api/${joinedPath}${requestUrl.search}`;
  }

  return app(request, response);
}
