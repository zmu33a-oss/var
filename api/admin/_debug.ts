import type { IncomingMessage, ServerResponse } from "http";

type VercelRequest = IncomingMessage & { query?: Record<string, string | string[]> };
type VercelResponse = ServerResponse & { json: (data: unknown) => void; status: (code: number) => VercelResponse };

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    env: {
      hasProjectId: Boolean(process.env.APPWRITE_PROJECT_ID),
      hasApiKey: Boolean(process.env.APPWRITE_API_KEY),
      hasAdminEmail: Boolean(process.env.VAR_ADMIN_EMAIL),
      projectId: process.env.APPWRITE_PROJECT_ID?.slice(0, 10) + "...",
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    },
    message: "Debug endpoint working",
  });
}
