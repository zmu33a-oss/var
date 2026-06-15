/**
 * تحميل شعارات الأندية السعودية محلياً (بدون API).
 * المصدر: Wikimedia Commons + Transfermarkt CDN (للتطوير).
 *
 * Usage: node scripts/download-saudi-club-logos.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "assets", "clubs", "saudi");
const userAgent = "VARApp/1.0 (local club emblem fetch)";

/** @type {Record<string, string>} */
const SOURCES = {
  hilal:
    "https://upload.wikimedia.org/wikipedia/commons/2/22/Al-Hilal-Logo.png",
  nassr: "https://tmssl.akamaized.net/images/wappen/head/12457.png",
  ittihad: "https://tmssl.akamaized.net/images/wappen/head/3840.png",
  ahli: "https://tmssl.akamaized.net/images/wappen/head/2814.png",
  shabab: "https://tmssl.akamaized.net/images/wappen/head/12058.png",
  ittefaq: "https://tmssl.akamaized.net/images/wappen/head/802.png",
  qadisiyah: "https://tmssl.akamaized.net/images/wappen/head/50547.png",
  raed: "https://tmssl.akamaized.net/images/wappen/head/12602.png",
  fayha: "https://tmssl.akamaized.net/images/wappen/head/50548.png",
  damak: "https://tmssl.akamaized.net/images/wappen/head/1847.png",
  tai: "https://tmssl.akamaized.net/images/wappen/head/6070.png",
  khaleej: "https://tmssl.akamaized.net/images/wappen/head/1846.png",
  abha: "https://tmssl.akamaized.net/images/wappen/head/31327.png",
  taawun: "https://tmssl.akamaized.net/images/wappen/head/12601.png",
  fateh: "https://tmssl.akamaized.net/images/wappen/head/50546.png",
  wehda: "https://tmssl.akamaized.net/images/wappen/head/1844.png",
};

function download(url, destination) {
  const result = spawnSync(
    "curl",
    ["-L", "-A", userAgent, "-s", "-f", "-o", destination, url],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error(`Failed to download ${url}`);
  }

  const size = fs.statSync(destination).size;
  if (size < 1024) {
    throw new Error(`Download too small for ${destination} (${size} bytes)`);
  }
}

fs.mkdirSync(outputDir, { recursive: true });

for (const [clubId, url] of Object.entries(SOURCES)) {
  const destination = path.join(outputDir, `${clubId}.png`);
  process.stdout.write(`Downloading ${clubId}... `);
  download(url, destination);
  process.stdout.write("ok\n");
}

console.log(`Saved ${Object.keys(SOURCES).length} logos to ${outputDir}`);
