const { spawn } = require("node:child_process");
const path = require("node:path");

require("./load-env.cjs");

const rootDir = path.resolve(__dirname, "..");

console.log("");
console.log("VAR full dev stack");
console.log("  Admin UI + API : http://localhost:3000/admin/");
console.log("  Expo web app   : http://localhost:8081/");
console.log("  Tip: /admin on :8081 redirects to :3000 automatically.");
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
start("expo", "npm", ["run", "web"]);

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
