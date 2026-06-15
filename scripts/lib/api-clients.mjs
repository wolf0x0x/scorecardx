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

async function tryCachedFetchJson(url, options, cachePath, ttlMs) {
  try {
    return await cachedFetchJson(url, options, cachePath, ttlMs);
  } catch (error) {
    return { error, json: null, source: "error", status: 0 };
  }
}

function endpoint(base, path, params = {}) {
  const url = new URL(path.replace(/^\//, ""), `${base.replace(/\/$/, "")}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function apiFootballHeaders(key, baseUrl) {
  const host = new URL(baseUrl).host;
  if (host.includes("rapidapi.com") || key.includes("msh")) {
    return {
      "x-rapidapi-key": key,
      "x-rapidapi-host": host
    };
  }
  return { "x-apisports-key": key };
}

function espnScoreboardUrl(sport, league) {
  return `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
}

function espnTeamName(competitor) {
  return competitor?.team?.displayName || competitor?.team?.shortDisplayName || competitor?.team?.name || "Team";
}

function espnStatus(event) {
  const type = event?.competitions?.[0]?.status?.type || event?.status?.type || {};
  return type.shortDetail || type.detail || type.description || "Scheduled";
}

function normalizeEspnScoreboard({ json, sport, league, accent, sourceName }) {
  const events = Array.isArray(json?.events) ? json.events : [];
  const fixtures = [];
  const liveCards = [];
  const standingsMap = new Map();
  const leaders = [];

  for (const event of events) {
    const competition = event.competitions?.[0] || {};
    const competitors = Array.isArray(competition.competitors) ? competition.competitors : [];
    const home = competitors.find((item) => item.homeAway === "home") || competitors[0] || {};
    const away = competitors.find((item) => item.homeAway === "away") || competitors[1] || {};
    const homeName = espnTeamName(home);
    const awayName = espnTeamName(away);
    const status = espnStatus(event);
    const eventDate = event.date || competition.date || "";
    const id = `${accent}-${event.id || `${homeName}-${awayName}`}`;

    liveCards.push({
      id,
      sport,
      league,
      status,
      clock: competition.status?.displayClock || competition.status?.type?.state || league,
      home: homeName,
      away: awayName,
      homeScore: String(home.score ?? "-"),
      awayScore: String(away.score ?? "-"),
      accent,
      note: `${competition.venue?.fullName || competition.venue?.address?.city || "Venue TBA"} · ${sourceName}`,
      source: sourceName.toLowerCase().replace(/\s+/g, "-")
    });

    fixtures.push({
      id: `${accent}-fixture-${event.id || `${homeName}-${awayName}`}`,
      date: eventDate.slice(0, 10),
      time: eventDate.slice(11, 16) || "TBA",
      sport,
      league,
      home: homeName,
      away: awayName,
      status,
      source: sourceName.toLowerCase().replace(/\s+/g, "-")
    });

    for (const competitor of competitors) {
      const name = espnTeamName(competitor);
      const record = competitor.records?.[0]?.summary || competitor.record || "";
      const [wins = "-", losses = "-"] = String(record).split("-");
      if (!standingsMap.has(name)) {
        standingsMap.set(name, {
          rank: standingsMap.size + 1,
          team: name,
          played: record || "-",
          wins,
          losses,
          points: competitor.score ?? "-",
          note: competitor.records?.[0]?.displayValue || "ESPN team record"
        });
      }

      for (const category of competitor.leaders || []) {
        for (const leader of category.leaders || []) {
          leaders.push({
            rank: leaders.length + 1,
            name: leader.athlete?.displayName || leader.displayName || name,
            team: name,
            metric: category.displayName || category.name || "Leader",
            value: leader.displayValue || String(leader.value ?? "-")
          });
        }
      }
    }
  }

  return {
    liveCards: liveCards.slice(0, 8),
    fixtures: fixtures.slice(0, 24),
    standings: Array.from(standingsMap.values()).slice(0, 12),
    playerStats: leaders.slice(0, 12)
  };
}

async function fetchEspnScoreboard({ sportPath, leaguePath, sport, league, accent, sourceName, cacheDir, ttlMs }) {
  const url = espnScoreboardUrl(sportPath, leaguePath);
  const { json, source } = await cachedFetchJson(url, {}, `${cacheDir}/espn-${accent}-scoreboard.json`, ttlMs);
  return {
    status: "ok",
    label: `${sourceName} ${source}`,
    ...normalizeEspnScoreboard({ json, sport, league, accent, sourceName })
  };
}

export async function fetchApiFootball({ key, baseUrl, cacheDir, quota, bucket = "live_scores" }) {
  if (!key) return { status: "not_configured", label: "API_FOOTBALL_KEY missing", liveCards: [], fixtures: [], standings: [] };
  if (!quota.canUse("apiFootball", bucket)) {
    return { status: "quota_exhausted", label: "API-Football quota exhausted", liveCards: [], fixtures: [], standings: [] };
  }
  quota.record("apiFootball", bucket);

  const headers = apiFootballHeaders(key, baseUrl);
  const liveUrl = endpoint(baseUrl, "/fixtures", { live: "all" });
  let { json, source, error } = await tryCachedFetchJson(liveUrl, { headers }, `${cacheDir}/api-football-live.json`, 5 * 60 * 1000);
  let mode = "live";
  if (error || !Array.isArray(json?.response) || json.response.length === 0) {
    mode = "fixtures";
    const fixturesUrl = endpoint(baseUrl, "/fixtures", { date: today() });
    const fallback = await tryCachedFetchJson(fixturesUrl, { headers }, `${cacheDir}/api-football-fixtures-today.json`, 30 * 60 * 1000);
    if (fallback.error) {
      const espn = await fetchEspnScoreboard({
        sportPath: "soccer",
        leaguePath: "eng.1",
        sport: "Football",
        league: "Premier League",
        accent: "football",
        sourceName: "ESPN EPL fallback",
        cacheDir,
        ttlMs: 15 * 60 * 1000
      });
      return {
        ...espn,
        label: `${espn.label} · API-Football unavailable (${fallback.error.message.slice(0, 120)})`
      };
    }
    json = fallback.json;
    source = fallback.source;
  }
  const fixtures = Array.isArray(json.response) ? json.response : [];
  return {
    status: "ok",
    label: `API-Football ${mode} ${source}`,
    liveCards: fixtures.slice(0, 8).map((item) => {
      const fixture = item.fixture || {};
      const teams = item.teams || {};
      const goals = item.goals || {};
      const league = item.league || {};
      return {
        id: `football-${fixture.id || `${teams.home?.name}-${teams.away?.name}`}`,
        sport: "Football",
        league: league.name || "Football",
        status: fixture.status?.elapsed ? `${fixture.status.elapsed}'` : fixture.status?.short || (mode === "live" ? "LIVE" : "SCHEDULED"),
        clock: fixture.status?.long || "Live",
        home: teams.home?.name || "Home",
        away: teams.away?.name || "Away",
        homeScore: String(goals.home ?? "-"),
        awayScore: String(goals.away ?? "-"),
        accent: "football",
        note: `${mode === "fixtures" ? "Free/delayed data" : "Live"} · ${league.country || "Global"} · ${fixture.venue?.name || "Venue TBA"}`,
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

  const headers = { "x-apisports-key": key };
  const liveUrl = endpoint(baseUrl, "/games", { live: "all" });
  let { json, source, error } = await tryCachedFetchJson(liveUrl, { headers }, `${cacheDir}/api-sports-cricket-live.json`, 5 * 60 * 1000);
  let mode = "live";
  if (error || !Array.isArray(json?.response) || json.response.length === 0) {
    mode = "fixtures";
    const gamesUrl = endpoint(baseUrl, "/games", { date: today() });
    const fallback = await cachedFetchJson(gamesUrl, { headers }, `${cacheDir}/api-sports-cricket-games-today.json`, 15 * 60 * 1000);
    json = fallback.json;
    source = fallback.source;
  }
  const games = Array.isArray(json.response) ? json.response : [];
  return {
    status: "ok",
    label: `API-Sports Cricket ${mode} ${source}`,
    liveCards: games.slice(0, 8).map((item) => {
      const teams = item.teams || {};
      const scores = item.scores || {};
      return {
        id: `cricket-${item.id || `${teams.home?.name}-${teams.away?.name}`}`,
        sport: "Cricket",
        league: item.league?.name || "Cricket",
        status: item.status?.short || item.status?.long || (mode === "live" ? "LIVE" : "SCHEDULED"),
        clock: item.date ? item.date.slice(11, 16) : "Live",
        home: teams.home?.name || item.teams?.home || "Home",
        away: teams.away?.name || item.teams?.away || "Away",
        homeScore: scores.home?.total ? `${scores.home.total}/${scores.home.wickets ?? "-"}` : String(scores.home ?? "-"),
        awayScore: scores.away?.total ? `${scores.away.total}/${scores.away.wickets ?? "-"}` : String(scores.away ?? "-"),
        accent: "cricket",
        note: `${mode === "fixtures" ? "Fixture feed" : "Live cricket scorecard"} · ${item.venue?.name || "Venue TBA"}`,
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
  if (!quota.canUse("basketball", bucket)) {
    return { status: "quota_exhausted", label: "Basketball quota exhausted", liveCards: [], fixtures: [], standings: [], playerStats: [] };
  }
  quota.record("basketball", bucket);

  const authHeaders = ballDontLieKey ? { Authorization: ballDontLieKey } : {};
  const url = endpoint("https://api.balldontlie.io/v1", "/games", { "dates[]": today(), per_page: 25 });
  let { json, source, error } = await tryCachedFetchJson(url, { headers: authHeaders }, `${cacheDir}/balldontlie-games.json`, 15 * 60 * 1000);
  if (error) {
    const espn = await fetchEspnScoreboard({
      sportPath: "basketball",
      leaguePath: "nba",
      sport: "Basketball",
      league: "NBA",
      accent: "basketball",
      sourceName: "ESPN NBA fallback",
      cacheDir,
      ttlMs: 10 * 60 * 1000
    });
    return {
      ...espn,
      label: `${espn.label} · BallDontLie unavailable (${error.message.slice(0, 120)})`
    };
  }
  const games = Array.isArray(json.data) ? json.data : [];
  return {
    status: "ok",
    label: `BallDontLie ${ballDontLieKey ? "auth" : "no-key"} ${source}`,
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
