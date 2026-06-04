const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const previewDir =
  process.env.VAR_PREVIEW_DIR?.trim() || path.join("/tmp", "var-preview");
const nodeModulesLink = path.join(previewDir, "node_modules");
const rootNodeModules = path.join(rootDir, "node_modules");

fs.mkdirSync(previewDir, { recursive: true });

const rsync = spawnSync(
  "rsync",
  [
    "-a",
    "--delete",
    "--exclude",
    "node_modules",
    "--exclude",
    ".git",
    "--exclude",
    "dist",
    "--exclude",
    ".expo",
    `${rootDir}${path.sep}`,
    `${previewDir}${path.sep}`,
  ],
  { stdio: "inherit" },
);

if (rsync.status !== 0) {
  process.exit(rsync.status ?? 1);
}

try {
  fs.lstatSync(nodeModulesLink);
} catch {
  if (fs.existsSync(rootNodeModules)) {
    fs.symlinkSync(rootNodeModules, nodeModulesLink);
  }
}

console.log(`Preview synced: ${previewDir}`);
