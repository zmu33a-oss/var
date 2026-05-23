const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const adminDir = path.join(distDir, "admin");
const indexHtml = path.join(distDir, "index.html");
const adminIndexHtml = path.join(adminDir, "index.html");

const placeholder = `<!doctype html>
<html lang="ar" dir="rtl">
  <head><meta charset="utf-8" /><title>VAR Dev Placeholder</title></head>
  <body><p>Local API dev placeholder. Use /admin after full build.</p></body>
</html>
`;

fs.mkdirSync(adminDir, { recursive: true });

if (!fs.existsSync(indexHtml)) {
  fs.writeFileSync(indexHtml, placeholder, "utf8");
}

if (!fs.existsSync(adminIndexHtml)) {
  fs.writeFileSync(adminIndexHtml, placeholder, "utf8");
}

console.log("dist placeholder ready for vercel dev --prebuilt");
