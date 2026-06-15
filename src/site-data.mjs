export const nav = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Football", href: "/football/", icon: "FB" },
  { label: "Basketball", href: "/basketball/", icon: "BK" },
  { label: "Cricket", href: "/cricket/", icon: "CR" },
  { label: "F1", href: "/other-sports/f1/", icon: "F1" },
  { label: "Tennis", href: "/other-sports/tennis/", icon: "TN" },
  { label: "Calendar", href: "/calendar/", icon: "CA" }
];

export const sportAccents = {
  cricket: "#22c55e",
  football: "#38bdf8",
  basketball: "#fb923c",
  f1: "#ef4444",
  tennis: "#a3e635",
  other: "#c084fc"
};

export const pages = [
  {
    path: "/",
    title: "ScorecardX - Live Sports Scores, Schedules and Data",
    eyebrow: "Global Sports Command Center",
    heading: "ScorecardX",
    summary: "A one-stop static sports intelligence platform for cricket-first live scores, football leagues, NBA coverage, F1 timing, tennis briefs, and cross-sport calendars.",
    active: "Home",
    accent: "cricket",
    hero: "home",
    focus: ["IPL live scores", "Five major football leagues", "NBA playoffs", "World Cup 2026", "F1 telemetry"],
    modules: ["Cricket", "Football", "Basketball", "F1", "Calendar"],
    cta: [
      { label: "Open Cricket Hub", href: "/cricket/" },
      { label: "Today Calendar", href: "/calendar/" }
    ]
  },
  {
    path: "/football/",
    title: "Football Hub - ScorecardX",
    eyebrow: "Football Hub",
    heading: "World football, live match pulse, and league intelligence.",
    summary: "Follow World Cup 2026 build-up, live scores, and the five major European leagues from one dense match center.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["World Cup 2026", "EPL", "La Liga", "Serie A", "Bundesliga", "Champions League"],
    modules: ["Live scores", "League tables", "Fixtures", "Match previews"],
    cta: [
      { label: "World Cup 2026", href: "/football/world-cup-2026/" },
      { label: "Live Scores", href: "/football/live-scores/" }
    ]
  },
  {
    path: "/football/world-cup-2026/",
    title: "World Cup 2026 - ScorecardX",
    eyebrow: "Football / Tournament Desk",
    heading: "World Cup 2026 qualification, venues, fixtures, and storylines.",
    summary: "A tournament-ready page for schedule modules, venue data, group standings, knockout paths, and SEO-rich match previews.",
    active: "Football",
    accent: "football",
    hero: "worldcup",
    focus: ["Venue tracker", "Group stage", "Knockout path", "Team form"],
    modules: ["Fixtures", "Groups", "Host cities", "Long-tail SEO pages"]
  },
  {
    path: "/football/leagues/",
    title: "Football Leagues - ScorecardX",
    eyebrow: "Football / League Index",
    heading: "Five major leagues and Champions League in one board.",
    summary: "EPL, La Liga, Serie A, Bundesliga, and Champions League pages share a consistent standings, fixture, and live-score layout.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["EPL", "La Liga", "Serie A", "Bundesliga", "Champions League"],
    modules: ["League table", "Top fixtures", "Title race", "Relegation watch"]
  },
  {
    path: "/football/leagues/epl/",
    title: "English Premier League - ScorecardX",
    eyebrow: "Football / EPL",
    heading: "Premier League live board and standings tracker.",
    summary: "A dedicated EPL surface for fixtures, standings deltas, top-six watch, and matchday SEO pages.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["Matchday", "Table", "Top scorers", "European race"],
    modules: ["Fixtures", "Standings", "Club form", "Player stats"]
  },
  {
    path: "/football/leagues/laliga/",
    title: "La Liga - ScorecardX",
    eyebrow: "Football / La Liga",
    heading: "La Liga scores, title race, and fixture intelligence.",
    summary: "Real-time cards and table modules for Spain's top flight, optimized for fast scanning on mobile.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["El Clasico watch", "Table movement", "Fixtures", "Form"],
    modules: ["Live scores", "Standings", "Team pages", "Match previews"]
  },
  {
    path: "/football/leagues/serie-a/",
    title: "Serie A - ScorecardX",
    eyebrow: "Football / Serie A",
    heading: "Serie A match center with compact standings and form.",
    summary: "Italian league coverage with fixture density, table snapshots, and player-stat slots ready for API data.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["Scudetto race", "Top scorers", "Form table", "Fixtures"],
    modules: ["Live scores", "Standings", "Teams", "Calendar"]
  },
  {
    path: "/football/leagues/bundesliga/",
    title: "Bundesliga - ScorecardX",
    eyebrow: "Football / Bundesliga",
    heading: "Bundesliga scores, table movement, and matchday feed.",
    summary: "Germany's top league in the same high-density command center used across ScorecardX.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["Title race", "European places", "Fixtures", "Live cards"],
    modules: ["Live scores", "Standings", "Club form", "Player stats"]
  },
  {
    path: "/football/leagues/champions-league/",
    title: "Champions League - ScorecardX",
    eyebrow: "Football / Champions League",
    heading: "Champions League fixtures, live scores, and knockout paths.",
    summary: "European night coverage built for live scoring, group tables, aggregate scorelines, and editorial previews.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["League phase", "Knockouts", "Aggregate scores", "Club form"],
    modules: ["Fixtures", "Tables", "Bracket", "Match previews"]
  },
  {
    path: "/football/live-scores/",
    title: "Football Live Scores - ScorecardX",
    eyebrow: "Football / Live Scores",
    heading: "Minute-by-minute football score strip.",
    summary: "A live-score first layout for API-Football updates, polling states, source fallback, and cached-data labeling.",
    active: "Football",
    accent: "football",
    hero: "football",
    focus: ["Live polling", "Source confidence", "Match clocks", "Score validation"],
    modules: ["Live cards", "Ticker", "Fallback cache", "Alerts"]
  },
  {
    path: "/basketball/",
    title: "Basketball Hub - ScorecardX",
    eyebrow: "Basketball Hub",
    heading: "NBA scores, playoff context, teams, players, and schedules.",
    summary: "A fast NBA-first surface for finals coverage, schedules, standings, and player dashboards.",
    active: "Basketball",
    accent: "basketball",
    hero: "basketball",
    focus: ["NBA Finals", "Teams", "Players", "Schedule"],
    modules: ["Live games", "Player leaders", "Team form", "Playoff bracket"],
    cta: [
      { label: "NBA Desk", href: "/basketball/nba/" },
      { label: "Schedule", href: "/basketball/schedule/" }
    ]
  },
  {
    path: "/basketball/nba/",
    title: "NBA Playoffs and Finals - ScorecardX",
    eyebrow: "Basketball / NBA",
    heading: "NBA playoffs, finals scoreboards, and series status.",
    summary: "A postseason command center for game state, series context, box-score leaders, and story-driven recaps.",
    active: "Basketball",
    accent: "basketball",
    hero: "basketball",
    focus: ["Finals", "Series score", "Box leaders", "Highlights"],
    modules: ["Live games", "Bracket", "Player leaders", "Recaps"]
  },
  {
    path: "/basketball/teams-players/",
    title: "Basketball Teams and Players - ScorecardX",
    eyebrow: "Basketball / Teams & Players",
    heading: "Team and player data cards for NBA analysis.",
    summary: "A player-stat and team-form workspace prepared for Highlightly NBA and BallDontLie style feeds.",
    active: "Basketball",
    accent: "basketball",
    hero: "basketball",
    focus: ["Player stats", "Team form", "Depth charts", "Injury slots"],
    modules: ["Leaders", "Team cards", "Player cards", "Comparison table"]
  },
  {
    path: "/basketball/schedule/",
    title: "Basketball Schedule - ScorecardX",
    eyebrow: "Basketball / Schedule",
    heading: "NBA calendar, records, and upcoming games.",
    summary: "A schedule-first basketball page with local time support, records, and daily game packs.",
    active: "Basketball",
    accent: "basketball",
    hero: "basketball",
    focus: ["Upcoming games", "Records", "Daily slate", "Timezone notes"],
    modules: ["Calendar", "Records", "Game cards", "Team streaks"]
  },
  {
    path: "/cricket/",
    title: "Cricket Hub - ScorecardX",
    eyebrow: "Cricket Hub",
    heading: "Cricket-first coverage for IPL, India series, and player stats.",
    summary: "The priority ScorecardX experience: live cricket scoring, over-by-over cards, Indian market SEO, and international series coverage.",
    active: "Cricket",
    accent: "cricket",
    hero: "cricket",
    focus: ["IPL 2026", "India series", "Player stats", "Live wickets"],
    modules: ["Live scorecards", "Tables", "Batting leaders", "Bowling leaders"],
    cta: [
      { label: "IPL Live Scores", href: "/cricket/ipl/" },
      { label: "Player Stats", href: "/cricket/players/" }
    ]
  },
  {
    path: "/cricket/ipl/",
    title: "IPL 2026 Live Scores - ScorecardX",
    eyebrow: "Cricket / IPL 2026",
    heading: "IPL live scores, powerplay context, wickets, and standings.",
    summary: "The MVP priority page, designed for five-minute updates, cached fallbacks, and match-by-match SEO pages.",
    active: "Cricket",
    accent: "cricket",
    hero: "cricket",
    focus: ["Live score", "Run rate", "Wickets", "Points table"],
    modules: ["Scorecards", "Upcoming matches", "Points table", "Player leaders"]
  },
  {
    path: "/cricket/international/",
    title: "India International Cricket - ScorecardX",
    eyebrow: "Cricket / International",
    heading: "India vs world series tracker.",
    summary: "A series hub for India fixtures, bilateral tours, ICC events, and match status cards.",
    active: "Cricket",
    accent: "cricket",
    hero: "cricket",
    focus: ["India tours", "ICC events", "Series score", "Fixtures"],
    modules: ["Series cards", "Fixtures", "Standings", "Recaps"]
  },
  {
    path: "/cricket/players/",
    title: "Cricket Player Statistics - ScorecardX",
    eyebrow: "Cricket / Players",
    heading: "Batting, bowling, and all-rounder leaderboards.",
    summary: "Daily refreshed player statistics for IPL and international cricket, using compact data tables and mobile-first cards.",
    active: "Cricket",
    accent: "cricket",
    hero: "cricket",
    focus: ["Orange cap", "Purple cap", "Strike rate", "Economy"],
    modules: ["Batting", "Bowling", "All-rounders", "Form"]
  },
  {
    path: "/other-sports/",
    title: "Other Sports - ScorecardX",
    eyebrow: "Other Sports",
    heading: "F1, tennis, and emerging sports in one expandable hub.",
    summary: "Coverage for sports outside the P0 stack, with F1 as the primary P1 module and tennis prepared for later data integrations.",
    active: "F1",
    accent: "f1",
    hero: "f1",
    focus: ["F1", "Tennis", "Other sports", "Data roadmap"],
    modules: ["Race center", "Tennis briefs", "Future feeds", "Calendar"]
  },
  {
    path: "/other-sports/f1/",
    title: "F1 Race Center - ScorecardX",
    eyebrow: "F1 / Race Center",
    heading: "F1 timing, sessions, standings, and telemetry-ready cards.",
    summary: "A race-weekend command center for Jolpica F1 data, OpenF1 telemetry slots, session clocks, and driver standings.",
    active: "F1",
    accent: "f1",
    hero: "f1",
    focus: ["Session timing", "Driver standings", "Constructor points", "Telemetry"],
    modules: ["Race weekend", "Standings", "Lap deltas", "Telemetry"]
  },
  {
    path: "/other-sports/tennis/",
    title: "Tennis - ScorecardX",
    eyebrow: "Other Sports / Tennis",
    heading: "Tennis coverage prepared for scrape or paid feed integration.",
    summary: "A pragmatic tennis page for schedules, match cards, and content modules while reliable free APIs remain limited.",
    active: "Tennis",
    accent: "tennis",
    hero: "tennis",
    focus: ["Fixtures", "Tournament pages", "Player form", "Data fallback"],
    modules: ["Daily slate", "Results", "Rankings", "Briefs"]
  },
  {
    path: "/other-sports/others/",
    title: "Other Sports Roadmap - ScorecardX",
    eyebrow: "Other Sports / Roadmap",
    heading: "Expandable lanes for additional sports.",
    summary: "A holding hub for sports with limited free data availability, ready for daily static content and future API coverage.",
    active: "F1",
    accent: "other",
    hero: "home",
    focus: ["Rugby", "Baseball", "MMA", "Cycling"],
    modules: ["Roadmap", "Daily briefs", "Calendar slots", "Source registry"]
  },
  {
    path: "/calendar/",
    title: "Sports Calendar - ScorecardX",
    eyebrow: "Cross-Sport Calendar",
    heading: "One daily slate for cricket, football, NBA, F1, and tennis.",
    summary: "A consolidated event calendar for SEO, reminders, and browsing across sports without changing sections.",
    active: "Calendar",
    accent: "other",
    hero: "calendar",
    focus: ["Today", "Tomorrow", "This week", "Priority events"],
    modules: ["Daily slate", "Sport filters", "Timezone notes", "Static JSON feed"]
  },
  {
    path: "/about/",
    title: "About ScorecardX",
    eyebrow: "About",
    heading: "A static-first sports data platform built for speed and coverage.",
    summary: "ScorecardX uses GitHub Pages, local scheduled Codex data jobs, static JSON, and page generation to keep operations light while covering high-traffic sports markets.",
    active: "Home",
    accent: "cricket",
    hero: "home",
    focus: ["Static pages", "Free API quotas", "Fallback cache", "SEO"],
    modules: ["Architecture", "Data sources", "Risk controls", "Contact"]
  }
];
