import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

function run(command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    if (code && code !== 0) process.exit(code);
  });

  return child;
}

const api = run("node", ["server.mjs"]);
const vite = run("vite", ["--host", "0.0.0.0"]);

function shutdown() {
  api.kill();
  vite.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
