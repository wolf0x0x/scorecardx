# ScorecardX

ScorecardX is a static, GitHub Pages ready sports intelligence hub focused on cricket, football, basketball, F1, tennis, and cross-sport calendars.

## Local workflow

```bash
npm run sync:data
npm run build
python3 -m http.server 4173 -d dist
```

The generated site is written to `dist/`. The `public/data` directory stores normalized static JSON that is consumed by the page builder.

## Live data setup

Copy `.env.example` to `.env` and add any provider keys you have:

```bash
cp .env.example .env
npm run sync:data
npm run build
```

Supported sync layers:

- API-Football via `API_FOOTBALL_KEY`
- API-Sports Cricket via `APISPORTS_CRICKET_KEY`
- NBA via BallDontLie when configured, with ESPN NBA scoreboard fallback
- Football via API-Football when configured, with ESPN Premier League scoreboard fallback
- F1 via public Jolpica endpoint

The sync layer keeps provider status, quota state, cache state, fixtures, live cards, standings, player leaders, and news in `public/data/scorecardx-data.json`. Missing keys are shown as configuration states on the site instead of fake live data. API-Football supports both direct API-Sports keys and RapidAPI keys; use `API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com/v3` for RapidAPI. On 2026-06-15, BallDontLie's current v1 endpoint returned HTTP 401 without a token, so ScorecardX treats BallDontLie as optional and uses ESPN NBA as the no-key production fallback.

## Local Codex scheduled update

For a 15-minute local GitHub Pages update loop:

```bash
npm run install:launchd
```

The scheduled task runs:

```bash
npm run sync:data
npm run build
git add public/data docs/launch-readiness.md
git commit -m "data: update ScorecardX sports data"
git push origin main
```

Manual one-shot publish:

```bash
npm run publish:data
```

## Pages

- `/`
- `/football/`
- `/football/world-cup-2026/`
- `/football/leagues/`
- `/football/leagues/epl/`
- `/football/leagues/laliga/`
- `/football/leagues/serie-a/`
- `/football/leagues/bundesliga/`
- `/football/leagues/champions-league/`
- `/football/live-scores/`
- `/basketball/`
- `/basketball/nba/`
- `/basketball/teams-players/`
- `/basketball/schedule/`
- `/cricket/`
- `/cricket/ipl/`
- `/cricket/international/`
- `/cricket/players/`
- `/other-sports/`
- `/other-sports/f1/`
- `/other-sports/tennis/`
- `/other-sports/others/`
- `/calendar/`
- `/about/`
