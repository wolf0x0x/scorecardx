import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const USER_AGENT = "ScorecardX/1.0 (+https://scorecardx.xyz)";

export function loadEnvFile(text = "") {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

export async function tryLoadEnv(path) {
  try {
    loadEnvFile(await readFile(path, "utf8"));
  } catch {
    // Optional local configuration.
  }
}

async function cachedFetchJson(url, options, cachePath, ttlMs) {
  const now = Date.now();
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    if (cached.savedAt && now - new Date(cached.savedAt).getTime() < ttlMs) {
      return { json: cached.payload, source: "cache", status: cached.status || 200 };
    }
  } catch {
    // Cache miss.
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json",
      ...(options?.headers || {})
    }
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 220)}`);
  }

  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(
    cachePath,
    `${JSON.stringify({ savedAt: new Date().toISOString(), status: response.status, payload: json }, null, 2)}\n`
  );
  return { json, source: "network", status: response.status };
}

function endpoint(base, path, params = {}) {
  const url = new URL(path.replace(/^\//, ""), `${base.replace(/\/$/, "")}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function fetchApiFootball({ key, baseUrl, cacheDir, quota, bucket = "live_scores" }) {
  if (!key) return { status: "not_configured", label: "API_FOOTBALL_KEY missing", liveCards: [], fixtures: [], standings: [] };
  if (!quota.canUse("apiFootball", bucket)) {
    return { status: "quota_exhausted", label: "API-Football quota exhausted", liveCards: [], fixtures: [], standings: [] };
  }
  quota.record("apiFootball", bucket);

  const liveUrl = endpoint(baseUrl, "/fixtures", { live: "all" });
  const { json, source } = await cachedFetchJson(liveUrl, { headers: { "x-apisports-key": key } }, `${cacheDir}/api-football-live.json`, 5 * 60 * 1000);
  const fixtures = Array.isArray(json.response) ? json.response : [];
  return {
    status: "ok",
    label: `API-Football ${source}`,
    liveCards: fixtures.slice(0, 8).map((item) => {
      const fixture = item.fixture || {};
      const teams = item.teams || {};
      const goals = item.goals || {};
      const league = item.league || {};
      return {
        id: `football-${fixture.id || `${teams.home?.name}-${teams.away?.name}`}`,
        sport: "Football",
        league: league.name || "Football",
        status: fixture.status?.elapsed ? `${fixture.status.elapsed}'` : fixture.status?.short || "LIVE",
        clock: fixture.status?.long || "Live",
        home: teams.home?.name || "Home",
        away: teams.away?.name || "Away",
        homeScore: String(goals.home ?? "-"),
        awayScore: String(goals.away ?? "-"),
        accent: "football",
        note: `${league.country || "Global"} · ${fixture.venue?.name || "Venue TBA"}`,
        source: "api-football"
      };
    }),
    fixtures: fixtures.slice(0, 20).map((item) => ({
      id: `football-fixture-${item.fixture?.id}`,
      date: (item.fixture?.date || "").slice(0, 10),
      time: (item.fixture?.date || "").slice(11, 16),
      sport: "Football",
      league: item.league?.name || "Football",
      home: item.teams?.home?.name || "Home",
      away: item.teams?.away?.name || "Away",
      status: item.fixture?.status?.short || "Scheduled",
      source: "api-football"
    })),
    standings: []
  };
}

export async function fetchApiSportsCricket({ key, baseUrl, cacheDir, quota, bucket = "live_scores" }) {
  if (!key) return { status: "not_configured", label: "APISPORTS_CRICKET_KEY missing", liveCards: [], fixtures: [], standings: [], playerStats: [] };
  if (!quota.canUse("apiSportsCricket", bucket)) {
    return { status: "quota_exhausted", label: "API-Sports Cricket quota exhausted", liveCards: [], fixtures: [], standings: [], playerStats: [] };
  }
  quota.record("apiSportsCricket", bucket);

  const liveUrl = endpoint(baseUrl, "/games", { live: "all" });
  const { json, source } = await cachedFetchJson(liveUrl, { headers: { "x-apisports-key": key } }, `${cacheDir}/api-sports-cricket-live.json`, 5 * 60 * 1000);
  const games = Array.isArray(json.response) ? json.response : [];
  return {
    status: "ok",
    label: `API-Sports Cricket ${source}`,
    liveCards: games.slice(0, 8).map((item) => {
      const teams = item.teams || {};
      const scores = item.scores || {};
      return {
        id: `cricket-${item.id || `${teams.home?.name}-${teams.away?.name}`}`,
        sport: "Cricket",
        league: item.league?.name || "Cricket",
        status: item.status?.short || item.status?.long || "LIVE",
        clock: item.date ? item.date.slice(11, 16) : "Live",
        home: teams.home?.name || item.teams?.home || "Home",
        away: teams.away?.name || item.teams?.away || "Away",
        homeScore: scores.home?.total ? `${scores.home.total}/${scores.home.wickets ?? "-"}` : String(scores.home ?? "-"),
        awayScore: scores.away?.total ? `${scores.away.total}/${scores.away.wickets ?? "-"}` : String(scores.away ?? "-"),
        accent: "cricket",
        note: item.venue?.name || "Live cricket scorecard",
        source: "api-sports-cricket"
      };
    }),
    fixtures: games.slice(0, 20).map((item) => ({
      id: `cricket-fixture-${item.id}`,
      date: (item.date || "").slice(0, 10),
      time: (item.date || "").slice(11, 16),
      sport: "Cricket",
      league: item.league?.name || "Cricket",
      home: item.teams?.home?.name || "Home",
      away: item.teams?.away?.name || "Away",
      status: item.status?.short || "Scheduled",
      source: "api-sports-cricket"
    })),
    standings: [],
    playerStats: []
  };
}

export async function fetchBasketball({ ballDontLieKey, cacheDir, quota, bucket = "live_scores" }) {
  if (!ballDontLieKey) return { status: "not_configured", label: "BALLDONTLIE_API_KEY missing", liveCards: [], fixtures: [], standings: [], playerStats: [] };
  if (!quota.canUse("basketball", bucket)) {
    return { status: "quota_exhausted", label: "Basketball quota exhausted", liveCards: [], fixtures: [], standings: [], playerStats: [] };
  }
  quota.record("basketball", bucket);

  const today = new Date().toISOString().slice(0, 10);
  const url = endpoint("https://api.balldontlie.io/v1", "/games", { "dates[]": today, per_page: 25 });
  const { json, source } = await cachedFetchJson(url, { headers: { Authorization: ballDontLieKey } }, `${cacheDir}/balldontlie-games.json`, 15 * 60 * 1000);
  const games = Array.isArray(json.data) ? json.data : [];
  return {
    status: "ok",
    label: `BallDontLie ${source}`,
    liveCards: games.slice(0, 8).map((game) => ({
      id: `nba-${game.id}`,
      sport: "Basketball",
      league: "NBA",
      status: game.status || "Scheduled",
      clock: game.period ? `Q${game.period}` : "NBA",
      home: game.home_team?.full_name || "Home",
      away: game.visitor_team?.full_name || "Away",
      homeScore: String(game.home_team_score ?? "-"),
      awayScore: String(game.visitor_team_score ?? "-"),
      accent: "basketball",
      note: `${game.season || "NBA"} regular/playoff slate`,
      source: "balldontlie"
    })),
    fixtures: games.map((game) => ({
      id: `nba-fixture-${game.id}`,
      date: (game.date || "").slice(0, 10),
      time: (game.datetime || "").slice(11, 16),
      sport: "Basketball",
      league: "NBA",
      home: game.home_team?.full_name || "Home",
      away: game.visitor_team?.full_name || "Away",
      status: game.status || "Scheduled",
      source: "balldontlie"
    })),
    standings: [],
    playerStats: []
  };
}

export async function fetchF1({ jolpicaBaseUrl, cacheDir }) {
  const standingsUrl = endpoint(jolpicaBaseUrl, "/current/driverStandings.json");
  const scheduleUrl = endpoint(jolpicaBaseUrl, "/current.json");
  const [standingsResult, scheduleResult] = await Promise.allSettled([
    cachedFetchJson(standingsUrl, {}, `${cacheDir}/jolpica-driver-standings.json`, 30 * 60 * 1000),
    cachedFetchJson(scheduleUrl, {}, `${cacheDir}/jolpica-schedule.json`, 6 * 60 * 60 * 1000)
  ]);

  const standingLists =
    standingsResult.status === "fulfilled"
      ? standingsResult.value.json.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []
      : [];
  const races =
    scheduleResult.status === "fulfilled"
      ? scheduleResult.value.json.MRData?.RaceTable?.Races || []
      : [];
  const nextRace = races.find((race) => new Date(`${race.date}T${race.time || "00:00:00Z"}`) >= new Date()) || races.at(-1);

  return {
    status: standingsResult.status === "fulfilled" || scheduleResult.status === "fulfilled" ? "ok" : "error",
    label: standingsResult.status === "fulfilled" ? `Jolpica F1 ${standingsResult.value.source}` : "Jolpica F1 unavailable",
    liveCards: nextRace
      ? [
          {
            id: `f1-${nextRace.round}`,
            sport: "F1",
            league: "Formula 1",
            status: "NEXT",
            clock: nextRace.date,
            home: nextRace.raceName || "Grand Prix",
            away: nextRace.Circuit?.circuitName || "Circuit",
            homeScore: `R${nextRace.round}`,
            awayScore: nextRace.time ? nextRace.time.replace("Z", " UTC") : "TBA",
            accent: "f1",
            note: nextRace.Circuit?.Location ? `${nextRace.Circuit.Location.locality}, ${nextRace.Circuit.Location.country}` : "F1 race calendar",
            source: "jolpica"
          }
        ]
      : [],
    fixtures: races.slice(0, 24).map((race) => ({
      id: `f1-fixture-${race.round}`,
      date: race.date,
      time: race.time || "TBA",
      sport: "F1",
      league: "Formula 1",
      home: race.raceName,
      away: race.Circuit?.circuitName || "Circuit",
      status: new Date(`${race.date}T${race.time || "00:00:00Z"}`) < new Date() ? "Completed" : "Scheduled",
      source: "jolpica"
    })),
    standings: standingLists.slice(0, 10).map((row, index) => ({
      rank: Number(row.position || index + 1),
      team: `${row.Driver?.givenName || ""} ${row.Driver?.familyName || ""}`.trim(),
      played: row.wins || "0",
      wins: row.wins || "0",
      losses: "-",
      points: row.points || "0",
      note: row.Constructors?.[0]?.name || "F1"
    })),
    playerStats: standingLists.slice(0, 10).map((row, index) => ({
      rank: Number(row.position || index + 1),
      name: `${row.Driver?.givenName || ""} ${row.Driver?.familyName || ""}`.trim(),
      team: row.Constructors?.[0]?.name || "F1",
      metric: "Driver points",
      value: row.points || "0"
    }))
  };
}
