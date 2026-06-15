import { readFile, writeFile } from "node:fs/promises";

const statePath = new URL("../public/data/sync_state.json", import.meta.url);
const livePath = new URL("../public/data/live-scorecards.json", import.meta.url);

const live = JSON.parse(await readFile(livePath, "utf8"));
live.updatedAt = new Date().toISOString();

await writeFile(livePath, `${JSON.stringify(live, null, 2)}\n`);
await writeFile(
  statePath,
  `${JSON.stringify(
    {
      lastSyncAt: live.updatedAt,
      mode: "placeholder",
      nextStep: "Replace this script with Codex scheduled API fetchers for API-Football, API-Sports Cricket, Highlightly NBA, and Jolpica F1."
    },
    null,
    2
  )}\n`
);

console.log(`ScorecardX data timestamp refreshed at ${live.updatedAt}`);
