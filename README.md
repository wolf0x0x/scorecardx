# ScorecardX

ScorecardX is a fast sports intelligence hub focused on cricket, football, basketball, F1, tennis, and cross-sport calendars.

## Local workflow

```bash
npm run sync:data
npm run build
python3 -m http.server 4173 -d dist
```

The generated site is written to `dist/`. The data layer stores normalized score, schedule, provider, and calendar snapshots for the page builder.

## Live data setup

Production provider keys should be stored in GitHub Actions secrets, not in local Codex automation and never in committed files:

- `API_FOOTBALL_KEY`
- `API_FOOTBALL_BASE_URL` (optional; RapidAPI default is `https://api-football-v1.p.rapidapi.com/v3`)
- `APISPORTS_CRICKET_KEY`
- `APISPORTS_CRICKET_BASE_URL` (optional)
- `APISPORTS_CRICKET_BASE_URLS` (optional comma-separated fallback hosts)
- `BALLDONTLIE_API_KEY` (optional)
- `JOLPICA_BASE_URL` (optional)

The `Sync ScorecardX sports data` workflow runs every 6 hours and can also be triggered manually from GitHub Actions. The sync script persists daily quota state and caps provider buckets so 100 req/day free-tier providers are not exhausted. `public/data/sync_state.json` is committed so GitHub runners can carry daily quota state and provider error streaks across runs.

For local debugging only, copy `.env.example` to `.env` and add temporary provider keys:

```bash
cp .env.example .env
npm run sync:data
npm run build
```

Supported sync layers:

- API-Football via `API_FOOTBALL_KEY`
- API-Sports Cricket via `APISPORTS_CRICKET_KEY`, with v3/v2/v1 endpoint fallback
- NBA via BallDontLie when configured, with ESPN NBA scoreboard fallback
- Football via API-Football when configured, with ESPN Premier League scoreboard fallback
- F1 via public Jolpica endpoint

The sync layer keeps provider status, quota state, cache state, fixtures, live cards, standings, player leaders, and news in `public/data/scorecardx-data.json`. Missing keys are shown as configuration states on the site instead of fake live data. API-Football supports both direct API-Sports keys and RapidAPI keys; use `API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com/v3` for RapidAPI. On 2026-06-15, BallDontLie's current v1 endpoint returned HTTP 401 without a token, so ScorecardX treats BallDontLie as optional and uses ESPN NBA as the no-key production fallback.

## Scheduled update

The production update loop is handled by GitHub Actions:

```bash
npm run sync:data
npm run build
git add public/data
git commit -m "data: update ScorecardX sports data"
git push
```

The legacy local launchd installer remains available for emergency/local-only operation, but provider keys should live in GitHub Secrets for the production site.

```bash
npm run install:launchd
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
