import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const bridgePort = Number.parseInt(env.N8N_BRIDGE_PORT || "", 10) || 5174;

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
      proxy: {
        // 1. الجسر القديم
        "/api-n8n": {
          target: "http://localhost:5678",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-n8n/, ""),
        },

        // 2. الجسر المطور مع منفذ مستقل عن خادم Vite
        "/api-write": {
          target: `http://localhost:${bridgePort}`,
          bypass: (req: any, res: any) => {
            if ((req.method === "POST" || req.method === "PUT") && res) {
              let body = "";
              req.on("data", (chunk: any) => {
                body += chunk;
              });
              req.on("end", () => {
                try {
                  const data = JSON.parse(body);

                  console.log("--- محاولة تعديل ملف ---");
                  console.log("المسار المستلم:", data.path);

                  if (!data.path || !data.content) {
                    res.writeHead(400);
                    res.end("Missing path or content");
                    return;
                  }

                  fs.writeFileSync(data.path, data.content, "utf8");

                  console.log("✅ تمت الكتابة بنجاح!");
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ status: "success" }));
                } catch (err) {
                  console.error("❌ فشل:", err);
                  if (!res.writableEnded) {
                    res.writeHead(500);
                    res.end("Error writing file");
                  }
                }
              });
              // هنا السر: لم نعد نكتب return true، نتركها فارغة لتجنب خطأ TypeScript
              return;
            }
          },
        },

        "/api/admin": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
  };
});
