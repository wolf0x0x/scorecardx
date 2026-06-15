import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchApiFootball, fetchApiSportsCricket, fetchBasketball, fetchF1, tryLoadEnv } from "./lib/api-clients.mjs";
import { aggregateProviderData, buildCalendar } from "./lib/normalize.mjs";
import { createQuotaManager, readQuotaState, writeQuotaState } from "./lib/quota.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicData = join(root, "public", "data");
const cacheDir = join(root, ".scorecardx-cache");
const quotaPath = join(cacheDir, "quota-state.json");

await tryLoadEnv(join(root, ".env"));
await mkdir(publicData, { recursive: true });
await mkdir(cacheDir, { recursive: true });

const quotaState = await readQuotaState(quotaPath);
const quota = createQuotaManager(quotaState);

const providerResults = {
  apiFootball: await Promise.allSettled([
    fetchApiFootball({
      key: process.env.API_FOOTBALL_KEY,
      baseUrl: process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
      cacheDir,
      quota
    })
  ]).then((items) => items[0]),
  apiSportsCricket: await Promise.allSettled([
    fetchApiSportsCricket({
      key: process.env.APISPORTS_CRICKET_KEY,
      baseUrl: process.env.APISPORTS_CRICKET_BASE_URL || "https://v1.cricket.api-sports.io",
      cacheDir,
      quota
    })
  ]).then((items) => items[0]),
  basketball: await Promise.allSettled([
    fetchBasketball({
      ballDontLieKey: process.env.BALLDONTLIE_API_KEY,
      cacheDir,
      quota
    })
  ]).then((items) => items[0]),
  jolpicaF1: await Promise.allSettled([
    fetchF1({
      jolpicaBaseUrl: process.env.JOLPICA_BASE_URL || "https://api.jolpi.ca/ergast/f1",
      cacheDir
    })
  ]).then((items) => items[0])
};

const data = aggregateProviderData(providerResults, quota);
try {
  const previous = JSON.parse(await readFile(join(publicData, "scorecardx-data.json"), "utf8"));
  const comparablePrevious = JSON.stringify({ ...previous, updatedAt: null });
  const comparableNext = JSON.stringify({ ...data, updatedAt: null });
  if (comparablePrevious === comparableNext && previous.updatedAt) {
    data.updatedAt = previous.updatedAt;
  }
} catch {
  // No previous data file yet.
}

const calendar = buildCalendar(data.fixtures);
if (calendar.events.length && data.updatedAt) {
  calendar.updatedAt = data.updatedAt;
}
const live = {
  updatedAt: data.updatedAt,
  cards: data.liveCards
};

await writeFile(join(publicData, "scorecardx-data.json"), `${JSON.stringify(data, null, 2)}\n`);
await writeFile(join(publicData, "live-scorecards.json"), `${JSON.stringify(live, null, 2)}\n`);
await writeFile(join(publicData, "calendar.json"), `${JSON.stringify(calendar, null, 2)}\n`);
await writeFile(
  join(publicData, "sync_state.json"),
  `${JSON.stringify(
    {
      lastSyncAt: data.updatedAt,
      mode: data.mode,
      freshness: data.freshness,
      providers: data.providers,
      quota: quota.snapshot()
    },
    null,
    2
  )}\n`
);
await writeQuotaState(quotaPath, quota.snapshot());

console.log(`ScorecardX data sync complete: ${data.freshness.status}`);
for (const [provider, state] of Object.entries(data.providers)) {
  console.log(`- ${provider}: ${state.status} (${state.label})`);
}
