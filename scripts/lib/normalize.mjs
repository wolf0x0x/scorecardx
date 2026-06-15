const sportKeys = {
  Cricket: "cricket",
  Football: "football",
  Basketball: "basketball",
  F1: "f1",
  Tennis: "tennis"
};

export function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackStandings(key, label) {
  return [
    {
      rank: 1,
      team: label,
      played: "-",
      wins: "-",
      losses: "-",
      points: "-",
      note: "Waiting for provider sync"
    }
  ];
}

function fallbackPlayerStats(label, metric = "Waiting for provider sync") {
  return [
    {
      rank: 1,
      name: label,
      team: "ScorecardX",
      metric,
      value: "-"
    }
  ];
}

export function buildCalendar(fixtures) {
  return {
    updatedAt: new Date().toISOString(),
    events: fixtures.slice(0, 50).map((fixture) => ({
      date: fixture.date || new Date().toISOString().slice(0, 10),
      sport: fixture.sport,
      event: `${fixture.league}: ${fixture.home} vs ${fixture.away}`,
      time: fixture.time || "TBA",
      priority: fixture.sport === "Cricket" || fixture.sport === "Football" || fixture.sport === "Basketball" ? "P0" : "P1"
    }))
  };
}

export function buildNews(providers) {
  const configured = Object.values(providers).filter((item) => item.status === "ok").length;
  const total = Object.keys(providers).length;
  return [
    {
      id: "data-pipeline-status",
      sport: "Platform",
      title: configured ? "ScorecardX live data pipeline updated" : "ScorecardX awaits API keys for full live coverage",
      summary: configured
        ? `${configured}/${total} provider groups refreshed. Static pages now distinguish live, cached, and provider states.`
        : "Set provider keys in .env or launchd to enable cricket, football, and basketball live data sync.",
      url: "/about/",
      source: "ScorecardX",
      publishedAt: new Date().toISOString()
    }
  ];
}

export function aggregateProviderData(results, quota) {
  const providers = {};
  const liveCards = [];
  const fixtures = [];
  const standings = {};
  const playerStats = {};

  for (const [name, result] of Object.entries(results)) {
    const data = result.status === "fulfilled" ? result.value : { status: "error", label: result.reason?.message || "Provider failed" };
    providers[name] = {
      status: data.status || "unknown",
      label: data.label || name,
      remainingQuota: quota.remaining?.(name) ?? null
    };
    liveCards.push(...(data.liveCards || []));
    fixtures.push(...(data.fixtures || []));
    if (data.standings?.length) standings[name === "apiSportsCricket" ? "cricket" : name === "apiFootball" ? "football" : name === "basketball" ? "basketball" : "f1"] = data.standings;
    if (data.playerStats?.length) playerStats[name === "apiSportsCricket" ? "cricket" : name === "apiFootball" ? "football" : name === "basketball" ? "basketball" : "f1"] = data.playerStats;
  }

  const uniqueLiveCards = uniqueBy(liveCards, (item) => item.id || `${item.sport}-${item.league}-${item.home}-${item.away}`);
  const uniqueFixtures = uniqueBy(fixtures, (item) => item.id || `${item.sport}-${item.date}-${item.home}-${item.away}`);

  const missingCards = [
    ["Cricket", "API-Sports Cricket", "APISPORTS_CRICKET_KEY", "cricket", "apiSportsCricket"],
    ["Football", "API-Football", "API_FOOTBALL_KEY", "football", "apiFootball"],
    ["Basketball", "NBA provider", "BALLDONTLIE_API_KEY", "basketball", "basketball"]
  ]
    .filter(([sport]) => !uniqueLiveCards.some((card) => card.sport === sport))
    .map(([sport, home, key, accent, providerName]) => {
      const provider = providers[providerName];
      const providerFailed = provider && !["not_configured", "quota_exhausted"].includes(provider.status);
      return {
        id: `config-${accent}`,
        sport,
        league: providerFailed ? "Provider unavailable" : "Data setup",
        status: providerFailed ? "ERROR" : "CONFIG",
        clock: providerFailed ? provider.status : "key needed",
        home,
        away: "ScorecardX",
        homeScore: providerFailed ? "error" : "ready",
        awayScore: "waiting",
        accent,
        note: providerFailed ? `Provider response: ${provider.label}` : `Set ${key} and run npm run sync:data.`,
        source: providerFailed ? "provider-status" : "configuration"
      };
    });

  const completeLiveCards = uniqueBy([...uniqueLiveCards, ...missingCards], (item) => item.id);

  for (const [label, key] of Object.entries(sportKeys)) {
    standings[key] ||= fallbackStandings(key, `${label} standings`);
    playerStats[key] ||= fallbackPlayerStats(`${label} leaders`);
  }

  return {
    updatedAt: new Date().toISOString(),
    mode: "automated-sync",
    freshness: {
      status: Object.values(providers).some((item) => item.status === "ok") ? "live_or_cached" : "degraded",
      label: Object.values(providers).some((item) => item.status === "ok")
        ? "Provider data refreshed from network/cache"
        : "API keys required for full live coverage",
      maxAgeMinutes: 30
    },
    providers,
    liveCards: completeLiveCards,
    fixtures: uniqueFixtures,
    standings,
    playerStats,
    news: buildNews(providers)
  };
}
