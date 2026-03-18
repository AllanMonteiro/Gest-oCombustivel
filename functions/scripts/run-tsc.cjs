const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const candidates = [
  path.resolve(__dirname, "../node_modules/typescript/bin/tsc"),
  path.resolve(__dirname, "../../node_modules/typescript/bin/tsc"),
];

const tscPath = candidates.find((candidate) => existsSync(candidate));

if (!tscPath) {
  console.error("Nao foi possivel localizar o TypeScript para compilar as Functions.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--max-old-space-size=4096", tscPath], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);