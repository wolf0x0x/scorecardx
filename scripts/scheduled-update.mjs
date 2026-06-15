import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(command, args, options = {}) {
  const { stdout, stderr } = await execFileAsync(command, args, { maxBuffer: 1024 * 1024 * 5, ...options });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

await run("npm", ["run", "sync:data"]);
await run("npm", ["run", "build"]);

const status = await execFileAsync("git", ["status", "--short"], { maxBuffer: 1024 * 1024 });
if (!status.stdout.trim()) {
  console.log("ScorecardX scheduled update: no data changes to publish.");
  process.exit(0);
}

await run("git", ["add", "public/data", "docs/launch-readiness.md"]);

const prefix = process.env.SCORECARDX_COMMIT_PREFIX || "data";
const message = `${prefix}: update ScorecardX sports data`;
try {
  await run("git", ["commit", "-m", message]);
} catch (error) {
  if (!String(error.stderr || error.message).includes("nothing to commit")) throw error;
}

await run("git", ["push", process.env.SCORECARDX_REMOTE || "origin", `HEAD:${process.env.SCORECARDX_BRANCH || "main"}`]);
console.log("ScorecardX scheduled update published.");
