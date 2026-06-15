import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { pages, nav, sportAccents } from "../src/site-data.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const publicDir = join(root, "public");

const live = JSON.parse(await readFile(join(publicDir, "data/live-scorecards.json"), "utf8"));
const calendar = JSON.parse(await readFile(join(publicDir, "data/calendar.json"), "utf8"));
const css = await readFile(join(root, "src/styles.css"), "utf8");
const appJs = await readFile(join(root, "src/app.js"), "utf8");

const heroImages = {
  home: "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=80')",
  football: "url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1800&q=80')",
  basketball: "url('https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1800&q=80')",
  cricket: "url('https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1800&q=80')",
  f1: "url('https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1800&q=80')",
  tennis: "url('https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1800&q=80')",
  worldcup: "url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1800&q=80')",
  calendar: "url('https://images.unsplash.com/photo-1505666287802-931dc83a55c1?auto=format&fit=crop&w=1800&q=80')"
};

const leagueRows = [
  ["IPL 2026", "Cricket", "5 min", "API-Sports Cricket", "P0"],
  ["Five major leagues", "Football", "15 min", "API-Football", "P0"],
  ["NBA Finals", "Basketball", "15 min", "Highlightly NBA", "P0"],
  ["World Cup 2026", "Football", "30 min", "API-Football", "P1"],
  ["F1 Race Week", "F1", "30 min", "Jolpica F1", "P1"],
  ["Tennis daily slate", "Tennis", "Daily", "Scrape or paid feed", "P3"]
];

const dataRows = [
  ["Cricket", "API-Sports Cricket", "100 req/day", "IPL, BBL, ICC", "Primary"],
  ["Football", "API-Football", "100 req/day", "1,200+ leagues", "Primary"],
  ["Basketball", "Highlightly NBA", "100 req/day", "NBA live and players", "Primary"],
  ["F1", "Jolpica F1", "Free/community", "1950-2026 seasons", "Primary"],
  ["F1 Telemetry", "OpenF1", "Free", "Live telemetry", "Enhancement"],
  ["Tennis", "Scrape or paid API", "Limited", "Tournament pages", "Fallback"]
];

const pageByPath = new Map(pages.map((page) => [page.path, page]));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function siteUrl(path) {
  return `https://wolf0x0x.github.io/scorecardx${path === "/" ? "/" : path}`;
}

function hrefFor(target, current) {
  const from = current === "/" ? "/" : current.replace(/\/$/, "");
  const to = target === "/" ? "/" : target.replace(/\/$/, "");
  const relative = posix.relative(from, to) || ".";
  return `${relative}/`;
}

function navHtml(active, accent, currentPath) {
  return nav
    .map((item) => `<a class="${item.label === active ? "active" : ""}" style="--accent:${accent}" href="${hrefFor(item.href, currentPath)}">${escapeHtml(item.label)}</a>`)
    .join("");
}

function tickerHtml() {
  const cards = [...live.cards, ...live.cards];
  return `<div class="ticker" aria-label="Live score ticker"><div class="ticker-track">${cards
    .map(
      (card) => `<article class="ticker-card glass-panel" style="--card-accent:${sportAccents[card.accent] || sportAccents.other}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <span class="status">${escapeHtml(card.status)}</span>
          <span class="label" style="color:var(--faint)">${escapeHtml(card.league)}</span>
        </div>
        <div class="score-line"><span class="team">${escapeHtml(card.home)}</span><span class="score">${escapeHtml(card.homeScore)}</span></div>
        <div class="score-line"><span class="team" style="color:var(--muted)">${escapeHtml(card.away)}</span><span class="score">${escapeHtml(card.awayScore)}</span></div>
        <p class="note">${escapeHtml(card.note)}</p>
      </article>`
    )
    .join("")}</div></div>`;
}

function heroBoard(page) {
  const activeCards = live.cards.filter((card) => page.active === "Home" || card.sport === page.active || (page.active === "F1" && card.sport === "F1"));
  const cards = activeCards.length ? activeCards : live.cards.slice(0, 2);
  return `<aside class="hero-board glass-panel">
    <div class="section-head" style="margin-bottom:12px">
      <div>
        <div class="label">Live Layer</div>
        <h2 style="font-size:22px;margin-top:4px">Realtime Snapshot</h2>
      </div>
      <span class="chip">updated <span data-updated-at="${escapeHtml(live.updatedAt)}">${escapeHtml(live.updatedAt)}</span></span>
    </div>
    <div class="grid" style="gap:12px">
      ${cards
        .slice(0, 3)
        .map(
          (card) => `<article class="ticker-card glass-panel" style="width:auto;--card-accent:${sportAccents[card.accent] || sportAccents.other}">
          <span class="status">${escapeHtml(card.status)}</span>
          <div class="score-line"><span class="team">${escapeHtml(card.home)}</span><span class="score">${escapeHtml(card.homeScore)}</span></div>
          <div class="score-line"><span class="team" style="color:var(--muted)">${escapeHtml(card.away)}</span><span class="score">${escapeHtml(card.awayScore)}</span></div>
          <p class="note">${escapeHtml(card.league)} · ${escapeHtml(card.clock)}</p>
        </article>`
        )
        .join("")}
    </div>
  </aside>`;
}

function cardsHtml(page) {
  const related = pages
    .filter((item) => item.path !== page.path && (item.active === page.active || page.active === "Home"))
    .slice(0, 6);
  const fallback = pages.filter((item) => item.path !== page.path).slice(0, 6);
  return (related.length ? related : fallback)
    .map(
      (item) => `<a class="card" style="--accent:${sportAccents[item.accent] || sportAccents.other}" href="${hrefFor(item.path, page.path)}">
        <div class="label">${escapeHtml(item.eyebrow)}</div>
        <h3>${escapeHtml(item.heading)}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </a>`
    )
    .join("");
}

function metricsHtml(page) {
  const values = [
    [page.focus[0] || "Live", "Primary surface for this section"],
    [page.modules[0] || "Scores", "Reusable static module"],
    ["< 1.5s", "Static page load target"],
    [page.active === "Cricket" ? "5 min" : page.active === "Home" ? "5-30 min" : "15-30 min", "Planned data cadence"]
  ];
  return values
    .map(
      ([value, label]) => `<article class="metric">
        <h3>${escapeHtml(label)}</h3>
        <div class="metric-value">${escapeHtml(value)}</div>
      </article>`
    )
    .join("");
}

function tableHtml(rows, headers) {
  return `<div class="table-panel"><table>
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(
        (row) => `<tr data-sport-row="${escapeHtml(String(row[1]).toLowerCase().split(" ")[0])}">${row
          .map((cell, index) => `<td class="${index === row.length - 1 ? "mono" : ""}">${escapeHtml(cell)}</td>`)
          .join("")}</tr>`
      )
      .join("")}</tbody>
  </table></div>`;
}

function calendarHtml() {
  return `<div class="chip-row" style="margin:0 0 14px">
    <button class="button primary" data-filter="all">All</button>
    <button class="button" data-filter="cricket">Cricket</button>
    <button class="button" data-filter="football">Football</button>
    <button class="button" data-filter="basketball">Basketball</button>
    <button class="button" data-filter="f1">F1</button>
  </div>
  <div class="table-panel"><table>
    <thead><tr><th>Date</th><th>Sport</th><th>Event</th><th>Time</th><th>Priority</th></tr></thead>
    <tbody>${calendar.events
      .map(
        (event) => `<tr data-sport-row="${escapeHtml(event.sport.toLowerCase().split(" ")[0])}">
        <td class="mono">${escapeHtml(event.date)}</td>
        <td>${escapeHtml(event.sport)}</td>
        <td>${escapeHtml(event.event)}</td>
        <td class="mono">${escapeHtml(event.time)}</td>
        <td class="mono">${escapeHtml(event.priority)}</td>
      </tr>`
      )
      .join("")}</tbody>
  </table></div>`;
}

function structuredData(page) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url: siteUrl(page.path),
    description: page.summary,
    isPartOf: {
      "@type": "WebSite",
      name: "ScorecardX",
      url: siteUrl("/")
    },
    about: page.focus.map((name) => ({ "@type": "Thing", name }))
  };
}

function pageHtml(page) {
  const accent = sportAccents[page.accent] || sportAccents.other;
  const jsonLd = JSON.stringify(structuredData(page));
  const relatedHeading = page.path === "/" ? "Feature Hubs" : "Related Pages";
  const contentTable = page.path === "/calendar/" ? calendarHtml() : tableHtml(page.active === "Home" ? leagueRows : dataRows, ["Module", "Sport", "Quota", "Coverage", "Status"]);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.summary)}">
  <link rel="canonical" href="${siteUrl(page.path)}">
  <link rel="preconnect" href="https://images.unsplash.com">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  <style>${css}</style>
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body style="--accent:${accent};--hero-image:${heroImages[page.hero] || heroImages.home}">
  <div class="shell">
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="${hrefFor("/", page.path)}">
          <span class="brand-mark">ScorecardX</span>
          <span class="brand-sub">Live Sports Data</span>
        </a>
        <nav class="nav" aria-label="Primary navigation">${navHtml(page.active, accent, page.path)}</nav>
        <label class="search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search matches">
        </label>
      </div>
    </header>
    <main class="page">
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">${escapeHtml(page.eyebrow)}</div>
          <h1>${escapeHtml(page.heading)}</h1>
          <p class="lead">${escapeHtml(page.summary)}</p>
          <div class="chip-row">${page.focus.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>
          <div class="hero-actions">
            ${(page.cta || [{ label: "Explore Calendar", href: "/calendar/" }, { label: "About Data", href: "/about/" }])
              .map((item, index) => `<a class="button ${index === 0 ? "primary" : ""}" href="${hrefFor(item.href, page.path)}">${escapeHtml(item.label)}</a>`)
              .join("")}
          </div>
        </div>
        ${heroBoard(page)}
      </section>
      ${tickerHtml()}
      <section class="section">
        <div class="section-head">
          <div>
            <div class="label">Performance Layer</div>
            <h2>What This Page Covers</h2>
          </div>
        </div>
        <div class="grid metrics">${metricsHtml(page)}</div>
      </section>
      <section class="section split">
        <div>
          <div class="section-head">
            <div>
              <div class="label">Static Data Surface</div>
              <h2>${page.path === "/calendar/" ? "Cross-Sport Schedule" : "Data Sources and Cadence"}</h2>
              <p>${page.path === "/calendar/" ? "Filter the consolidated calendar without leaving the static page." : "Each module is designed to be filled by scheduled Codex jobs and rebuilt into GitHub Pages."}</p>
            </div>
          </div>
          ${contentTable}
        </div>
        <aside>
          <div class="section-head">
            <div>
              <div class="label">Modules</div>
              <h2>Ready Components</h2>
            </div>
          </div>
          <div class="grid">${page.modules
            .map(
              (module) => `<article class="card" style="--accent:${accent};min-height:120px">
              <h3>${escapeHtml(module)}</h3>
              <p>Prepared for static JSON hydration, cached fallback labels, and SEO-friendly standalone pages.</p>
            </article>`
            )
            .join("")}</div>
        </aside>
      </section>
      <section class="section">
        <div class="section-head">
          <div>
            <div class="label">Navigation Map</div>
            <h2>${relatedHeading}</h2>
          </div>
        </div>
        <div class="grid cards">${cardsHtml(page)}</div>
      </section>
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <span>ScorecardX static build · updated from local JSON feeds</span>
        <span>GitHub Pages ready · cricket-first sports aggregation</span>
      </div>
    </footer>
  </div>
  <script>${appJs}</script>
</body>
</html>`;
}

async function writePage(page) {
  const filePath = join(dist, page.path, "index.html");
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, pageHtml(page));
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all(pages.map(writePage));
await cp(publicDir, dist, { recursive: true });
await writeFile(
  join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: https://wolf0x0x.github.io/scorecardx/sitemap.xml\n`
);
await writeFile(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((page) => `  <url><loc>${siteUrl(page.path)}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
await writeFile(join(dist, ".nojekyll"), "");

console.log(`Built ${pages.length} ScorecardX pages into dist/`);
