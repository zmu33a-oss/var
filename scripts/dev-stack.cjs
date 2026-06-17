const { spawn } = require("node:child_process");
const path = require("node:path");

require("./load-env.cjs");

const rootDir = path.resolve(__dirname, "..");

console.log("");
const os = require("node:os");

function resolveLanIp() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (
        (entry.family === "IPv4" || entry.family === 4) &&
        !entry.internal &&
        entry.address.startsWith("192.168.")
      ) {
        return entry.address;
      }
    }
  }

  return "";
}

const lanIp = resolveLanIp();

console.log("VAR full dev stack");
console.log("  Admin UI + API : http://localhost:3000/admin/");
console.log("  Expo PC        : http://localhost:8081/");
if (lanIp) {
  console.log(`  Expo Mobile    : http://${lanIp}:8081/`);
  console.log(`  API Mobile     : http://${lanIp}:3000/`);
}
console.log("  Same Wi-Fi required on phone and PC.");
console.log("");

const children = [];

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${name}] stopped (${signal})`);
      return;
    }

    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  children.push(child);
  return child;
}

start("admin", "npm", ["run", "admin:dev"]);
start("expo", "npm", ["run", "web:lan"]);

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
