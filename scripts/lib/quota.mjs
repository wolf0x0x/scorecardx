import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const DEFAULT_QUOTAS = {
  apiFootball: {
    dailyLimit: 100,
    live_scores: 30,
    fixtures: 20,
    standings: 10,
    player_stats: 15,
    team_info: 10,
    buffer: 15
  },
  apiSportsCricket: {
    dailyLimit: 100,
    live_scores: 40,
    fixtures: 20,
    standings: 10,
    player_stats: 15,
    buffer: 15
  },
  basketball: {
    dailyLimit: 100,
    live_scores: 25,
    fixtures: 20,
    standings: 20,
    player_stats: 20,
    buffer: 15
  }
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function readQuotaState(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return { day: todayKey(), providers: {} };
  }
}

export async function writeQuotaState(path, state) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`);
}

export function createQuotaManager(state, quotas = DEFAULT_QUOTAS, now = new Date()) {
  const day = todayKey(now);
  if (state.day !== day) {
    state.day = day;
    state.providers = {};
  }

  function ensure(provider) {
    state.providers[provider] ||= { used: 0, buckets: {} };
    return state.providers[provider];
  }

  return {
    canUse(provider, bucket, cost = 1) {
      const quota = quotas[provider];
      if (!quota) return true;
      const item = ensure(provider);
      const bucketLimit = quota[bucket] ?? quota.buffer ?? quota.dailyLimit;
      const bucketUsed = item.buckets[bucket] || 0;
      return item.used + cost <= quota.dailyLimit && bucketUsed + cost <= bucketLimit;
    },
    record(provider, bucket, cost = 1) {
      const item = ensure(provider);
      item.used += cost;
      item.buckets[bucket] = (item.buckets[bucket] || 0) + cost;
    },
    remaining(provider) {
      const quota = quotas[provider];
      if (!quota) return null;
      const item = ensure(provider);
      return Math.max(0, quota.dailyLimit - item.used);
    },
    snapshot() {
      return state;
    }
  };
}
