import type { IncomingMessage, ServerResponse } from "http";

type VercelRequest = IncomingMessage & { query?: Record<string, string | string[]>; body?: unknown };
type VercelResponse = ServerResponse & { json: (data: unknown) => void; status: (code: number) => VercelResponse };

function readQueryParam(req: VercelRequest, key: string): string {
  const val = req.query?.[key];
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

async function parseBody(req: VercelRequest): Promise<void> {
  if (req.body !== undefined) return;

  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    (req as any).body = Buffer.from("");
    return;
  }

  if ((req as any).readableEnded || (req as any).complete) {
    (req as any).body = Buffer.from("");
    return;
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const finish = () => {
      (req as any).body = Buffer.concat(chunks);
      resolve();
    };

    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", finish);
    req.on("error", finish);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug headers
  console.log('[DEBUG] admin/index headers:', JSON.stringify(req.headers, null, 2));
  
  await parseBody(req);

  const section = readQueryParam(req, "section");
  const action = readQueryParam(req, "action");

  if (section && action) {
    if (!req.query) (req as any).query = {};
    (req as any).query.action = action;
  }

  const route = section || action;

  switch (route) {
    case "audit":
      return (await import("./_audit")).default(req, res);
    case "health":
      return (await import("./_health")).default(req, res);
    case "keys":
      return (await import("./_keys")).default(req, res);
    case "login":
      return (await import("./_login")).default(req, res);
    case "me":
      return (await import("./_me")).default(req, res);
    case "moderation":
      return (await import("./_moderation")).default(req, res);
    case "posts":
      return (await import("./_posts")).default(req, res);
    case "settings":
      return (await import("./_settings")).default(req, res);
    case "users":
      return (await import("./_users")).default(req, res);
    case "debug":
      return (await import("./_debug")).default(req, res);
    default:
      res.status(404).json({ error: "Unknown route" });
  }
}
