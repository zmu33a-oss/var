const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const previewDir =
  process.env.VAR_PREVIEW_DIR?.trim() || path.join("/tmp", "var-preview");
const nodeModulesLink = path.join(previewDir, "node_modules");
const rootNodeModules = path.join(rootDir, "node_modules");

function syncWithPowerShellCopy() {
  const copyScript = [
    `$ErrorActionPreference = 'Stop'`,
    `$src = '${rootDir.replace(/'/g, "''")}'`,
    `$dst = '${previewDir.replace(/'/g, "''")}'`,
    `Get-ChildItem -LiteralPath $dst -Force | Where-Object { $_.Name -notin @('node_modules') } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue`,
    `Get-ChildItem -LiteralPath $src -Force | Where-Object { $_.Name -notin @('node_modules','.git','dist','.expo') } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $dst -Recurse -Force }`,
  ].join('; ');

  const copy = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", copyScript],
    { stdio: "inherit" },
  );

  return copy.status ?? 1;
}

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

if (rsync.error && process.platform === "win32") {
  const copyStatus = syncWithPowerShellCopy();

  if (copyStatus !== 0) {
    process.exit(copyStatus);
  }
} else if (rsync.status !== 0) {
  process.exit(rsync.status ?? 1);
}

try {
  fs.lstatSync(nodeModulesLink);
} catch {
  if (fs.existsSync(rootNodeModules)) {
    try {
      fs.symlinkSync(
        rootNodeModules,
        nodeModulesLink,
        process.platform === "win32" ? "junction" : "dir",
      );
    } catch (linkError) {
      const fallbackCopy = spawnSync(
        "powershell",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          [
            "$ErrorActionPreference = 'Stop'",
            `$src = '${rootNodeModules.replace(/'/g, "''")}'`,
            `$dst = '${nodeModulesLink.replace(/'/g, "''")}'`,
            "Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force",
          ].join("; "),
        ],
        { stdio: "inherit" },
      );

      if (fallbackCopy.status !== 0) {
        throw linkError;
      }
    }
  }
}

console.log(`Preview synced: ${previewDir}`);
