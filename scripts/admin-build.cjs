const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "admin-web");
const targetDir = path.join(rootDir, "dist", "admin");

const staticFiles = ["index.html", "admin.js"];

if (!fs.existsSync(sourceDir)) {
  throw new Error("admin-web directory was not found.");
}

fs.mkdirSync(targetDir, { recursive: true });

for (const fileName of staticFiles) {
  const sourcePath = path.join(sourceDir, fileName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`${fileName} was not found in admin-web.`);
  }
  fs.copyFileSync(sourcePath, path.join(targetDir, fileName));
}

console.log("Admin static files copied to dist/admin/");
