# ScorecardX

ScorecardX is a static, GitHub Pages ready sports intelligence hub focused on cricket, football, basketball, F1, tennis, and cross-sport calendars.

## Local workflow

```bash
npm run build
python3 -m http.server 4173 -d dist
```

The generated site is written to `dist/`. The `public/data` directory is reserved for Codex scheduled jobs that fetch, normalize, and publish sports data into static JSON files before each build.

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
