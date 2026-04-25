const http = require("http");
const fs = require("fs");
const path = require("path");

const BRIDGE_PORT =
  Number.parseInt(process.env.N8N_BRIDGE_PORT || "", 10) || 5174;

const server = http.createServer((req, res) => {
  // 1. إعدادات الأمان (CORS) لدعم n8n و ngrok
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, ngrok-skip-browser-warning",
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 2. مسار القراءة (GET) - عرض الموقع في المتصفح
  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("خطأ: تأكد من وجود ملف index.html في المجلد الرئيسي.");
        return;
      }
      // إرسال الهيدر مع دعم اللغة العربية (utf-8)
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
  }

  // 3. مسار التعديل (POST) - استقبال الأوامر من n8n
  else if (req.method === "POST" && req.url === "/api-write") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.path || data.content === undefined) {
          res.writeHead(400);
          res.end("Missing path or content in JSON");
          return;
        }

        const fullPath = path.join(__dirname, data.path);

        // حفظ الملف بترميز utf-8 لضمان ظهور اللغة العربية بشكل سليم
        fs.writeFileSync(fullPath, data.content, "utf-8");

        console.log(`✅ تم تحديث الملف بنجاح: ${data.path}`);
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Success");
      } catch (err) {
        console.error("❌ خطأ في معالجة الطلب:", err);
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });
  }
});

// تشغيل السيرفر على منفذ مستقل حتى لا يتعارض مع Vite
server.listen(BRIDGE_PORT, () =>
  console.log(`🚀 Bridge Server Ready at http://localhost:${BRIDGE_PORT}`),
);
