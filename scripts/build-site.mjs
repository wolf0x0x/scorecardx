import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { pages, languages, i18nNav, uiLabels, sportAccents } from "../src/site-data.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const publicDir = join(root, "public");

const live = JSON.parse(await readFile(join(publicDir, "data/live-scorecards.json"), "utf8"));
const calendar = JSON.parse(await readFile(join(publicDir, "data/calendar.json"), "utf8"));
const scorecardxData = JSON.parse(await readFile(join(publicDir, "data/scorecardx-data.json"), "utf8"));
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function siteUrl(lang, path) {
  const base = "https://wolf0x0x.github.io/scorecardx";
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `${base}${prefix}${path === "/" ? "/" : path}`;
}

function hrefFor(target, current, lang) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  const actualTarget = target === "/" ? `${prefix}/` : `${prefix}${target}`;
  const actualCurrent = current === "/" ? `${prefix}/` : `${prefix}${current}`;
  const from = actualCurrent === "/" ? "/" : actualCurrent.replace(/\/$/, "");
  const to = actualTarget === "/" ? "/" : actualTarget.replace(/\/$/, "");
  const relative = posix.relative(from, to) || ".";
  return `${relative}/`;
}

function langHrefFor(targetPath, currentPath, targetLang, currentLang) {
  const actualCurrent = currentLang === "en" ? currentPath : `/${currentLang}${currentPath}`;
  const actualTarget = targetLang === "en" ? targetPath : `/${targetLang}${targetPath}`;
  const from = actualCurrent === "/" ? "/" : actualCurrent.replace(/\/$/, "");
  const to = actualTarget === "/" ? "/" : actualTarget.replace(/\/$/, "");
  const relative = posix.relative(from, to) || ".";
  return `${relative}/`;
}

function assetHrefFor(assetPath, currentPath, lang) {
  const current = lang === "en" ? currentPath : `/${lang}${currentPath}`;
  const from = current === "/" ? "/" : current.replace(/\/$/, "");
  const to = assetPath.replace(/\/$/, "");
  const relative = posix.relative(from, to) || ".";
  return relative;
}

function navHtml(active, accent, currentPath, lang) {
  const items = i18nNav[lang] || i18nNav.en;
  return items
    .map((item) => {
      const isActive =
        item.href === "/"
          ? currentPath === "/"
          : currentPath.startsWith(item.href);
      return `<a class="${isActive ? "active" : ""}" style="--accent:${accent}" href="${hrefFor(item.href, currentPath, lang)}">${escapeHtml(item.label)}</a>`;
    })
    .join("");
}

function langSwitchHtml(currentPath, lang) {
  const links = Object.keys(languages)
    .map((l) => {
      const isActive = l === lang;
      const activeAttr = isActive ? 'style="color:var(--accent);font-weight:800;"' : "";
      return `<a href="${langHrefFor(currentPath, currentPath, l, lang)}" ${activeAttr}>${languages[l].name}</a>`;
    })
    .join("<span style='color:var(--border)'>|</span>");
  return `<div class="lang-selector" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">${links}</div>`;
}

function getAdHtml(zone) {
  return `
  <div class="ad-container ad-${zone}" style="margin:20px auto;text-align:center;background:rgba(30,41,59,0.4);border:1px dashed var(--border);padding:15px;border-radius:8px;max-width:100%;">
    <span style="font-size:10px;color:var(--faint);text-transform:uppercase;display:block;margin-bottom:8px;">Advertisement [${zone.toUpperCase()}]</span>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-8695398658548679"
         data-ad-slot="1234567890"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  </div>`;
}

function dataKeyForPage(page) {
  if (page.active === "Cricket") return "cricket";
  if (page.active === "Football") return "football";
  if (page.active === "Basketball") return "basketball";
  if (page.active === "F1") return "f1";
  if (page.active === "Tennis") return "tennis";
  return "all";
}

function liveCardsForPage(page) {
  const cards = scorecardxData.liveCards?.length ? scorecardxData.liveCards : live.cards || [];
  const wanted = page.active === "Home" || page.path === "/calendar/" ? cards : cards.filter((card) => card.sport === page.active || (page.active === "F1" && card.sport === "F1"));
  const selected = wanted.length ? wanted : cards;
  const seen = new Set();
  return selected.filter((card) => {
    const key = card.id || `${card.sport}-${card.league}-${card.home}-${card.away}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function tickerHtml() {
  const cards = liveCardsForPage({ active: "Home", path: "/" });
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

function heroBoard(page, lang) {
  const labels = uiLabels[lang] || uiLabels.en;
  const cards = liveCardsForPage(page).slice(0, 3);
  return `<aside class="hero-board glass-panel">
    <div class="section-head" style="margin-bottom:12px">
      <div>
        <div class="label">${escapeHtml(labels.liveLayer)}</div>
        <h2 style="font-size:22px;margin-top:4px">${escapeHtml(labels.realtimeSnap)}</h2>
      </div>
      <span class="chip">${escapeHtml(labels.updated)} <span data-updated-at="${escapeHtml(live.updatedAt)}">${escapeHtml(live.updatedAt)}</span></span>
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

function providerHealthHtml() {
  const providers = scorecardxData.providers || {};
  const entries = Object.entries(providers);
  if (!entries.length) return "";
  return `<section class="section">
    <div class="section-head">
      <div>
        <div class="label">Data Health</div>
        <h2>Provider Status</h2>
        <p>${escapeHtml(scorecardxData.freshness?.label || "Provider status unavailable")} · Updated ${escapeHtml(scorecardxData.updatedAt || live.updatedAt)}</p>
      </div>
    </div>
    <div class="grid metrics">${entries
      .map(([name, state]) => `<article class="metric">
        <h3>${escapeHtml(name)}</h3>
        <span class="source-badge source-${escapeHtml(state.status || "unknown")}">${escapeHtml(state.status || "unknown")}</span>
        <p>${escapeHtml(state.label || "")}</p>
        <div class="metric-value">${state.remainingQuota === null || state.remainingQuota === undefined ? "∞" : escapeHtml(state.remainingQuota)}</div>
      </article>`)
      .join("")}</div>
  </section>`;
}

function fixturesForPage(page) {
  const fixtures = scorecardxData.fixtures || [];
  if (page.path === "/calendar/" || page.active === "Home") return fixtures;
  return fixtures.filter((fixture) => fixture.sport === page.active || (page.active === "F1" && fixture.sport === "F1"));
}

function fixturesHtml(page) {
  const fixtures = fixturesForPage(page).slice(0, 10);
  if (!fixtures.length) {
    return `<div class="empty-state">No fixtures are available yet. The scheduled updater will publish fixtures after provider sync.</div>`;
  }
  return `<div class="fixture-list">${fixtures
    .map((fixture) => `<article class="fixture-item">
      <div class="fixture-time">
        <strong>${escapeHtml(fixture.time || "TBA")}</strong>
        <span>${escapeHtml(fixture.date || "")}</span>
      </div>
      <div class="fixture-teams">
        <span>${escapeHtml(fixture.home || "Home")}</span>
        <em>vs</em>
        <span>${escapeHtml(fixture.away || "Away")}</span>
      </div>
      <div class="fixture-meta">
        <span>${escapeHtml(fixture.league || fixture.sport || "")}</span>
        <span class="source-badge">${escapeHtml(fixture.status || fixture.source || "scheduled")}</span>
      </div>
    </article>`)
    .join("")}</div>`;
}

function domainRows(page, domain) {
  const key = dataKeyForPage(page);
  if (domain === "standings") {
    if (key === "all") return Object.values(scorecardxData.standings || {}).flat().slice(0, 10);
    return scorecardxData.standings?.[key] || [];
  }
  if (key === "all") return Object.values(scorecardxData.playerStats || {}).flat().slice(0, 10);
  return scorecardxData.playerStats?.[key] || [];
}

function standingsHtml(page) {
  const rows = domainRows(page, "standings");
  if (!rows.length) return `<div class="empty-state">No standings published yet.</div>`;
  return `<div class="table-panel"><table>
    <thead><tr><th>Rank</th><th>Team / Driver</th><th>Played</th><th>Wins</th><th>Losses</th><th>Points</th></tr></thead>
    <tbody>${rows
      .map((row) => `<tr>
        <td class="mono">${escapeHtml(row.rank ?? "-")}</td>
        <td>${escapeHtml(row.team || row.name || "-")}<div class="note">${escapeHtml(row.note || "")}</div></td>
        <td class="mono">${escapeHtml(row.played ?? "-")}</td>
        <td class="mono">${escapeHtml(row.wins ?? "-")}</td>
        <td class="mono">${escapeHtml(row.losses ?? "-")}</td>
        <td class="mono">${escapeHtml(row.points ?? "-")}</td>
      </tr>`)
      .join("")}</tbody>
  </table></div>`;
}

function playerStatsHtml(page) {
  const rows = domainRows(page, "playerStats");
  if (!rows.length) return `<div class="empty-state">No player statistics published yet.</div>`;
  return `<div class="table-panel"><table>
    <thead><tr><th>Rank</th><th>Name</th><th>Team</th><th>Metric</th><th>Value</th></tr></thead>
    <tbody>${rows
      .map((row) => `<tr>
        <td class="mono">${escapeHtml(row.rank ?? "-")}</td>
        <td>${escapeHtml(row.name || "-")}</td>
        <td>${escapeHtml(row.team || "-")}</td>
        <td>${escapeHtml(row.metric || "-")}</td>
        <td class="mono">${escapeHtml(row.value ?? "-")}</td>
      </tr>`)
      .join("")}</tbody>
  </table></div>`;
}

function newsHtml(page) {
  const key = dataKeyForPage(page);
  const news = (scorecardxData.news || []).filter((item) => key === "all" || item.sport?.toLowerCase() === key || item.sport === "Platform").slice(0, 4);
  if (!news.length) return `<div class="empty-state">No news items published yet.</div>`;
  return `<div class="news-grid">${news
    .map((item) => `<article class="news-card">
      <div class="news-tag">${escapeHtml(item.sport || "Sports")} · ${escapeHtml(item.source || "ScorecardX")}</div>
      <h3>${escapeHtml(item.title || "Untitled update")}</h3>
      <p>${escapeHtml(item.summary || "")}</p>
      <a class="button" href="${hrefFor(item.url || "/about/", page.path, "en")}">Read more</a>
    </article>`)
    .join("")}</div>`;
}

function liveGridHtml(page) {
  const cards = liveCardsForPage(page).slice(0, 6);
  return `<div class="grid cards">${cards
    .map((card) => `<article class="ticker-card glass-panel" style="width:auto;--card-accent:${sportAccents[card.accent] || sportAccents.other}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <span class="status">${escapeHtml(card.status)}</span>
        <span class="label" style="color:var(--faint)">${escapeHtml(card.league)}</span>
      </div>
      <div class="score-line"><span class="team">${escapeHtml(card.home)}</span><span class="score score-update">${escapeHtml(card.homeScore)}</span></div>
      <div class="score-line"><span class="team" style="color:var(--muted)">${escapeHtml(card.away)}</span><span class="score score-update">${escapeHtml(card.awayScore)}</span></div>
      <p class="note">${escapeHtml(card.note || card.source || "")}</p>
    </article>`)
    .join("")}</div>`;
}

function cardsHtml(page, currentPath, lang) {
  const related = pages
    .filter((item) => item.path !== page.path && (item.active === page.active || page.active === "Home"))
    .slice(0, 6);
  const fallback = pages.filter((item) => item.path !== page.path).slice(0, 6);
  return (related.length ? related : fallback)
    .map((item) => {
      const content = item.i18n[lang] || item.i18n.en;
      return `<a class="card" style="--accent:${sportAccents[item.accent] || sportAccents.other}" href="${hrefFor(item.path, currentPath, lang)}">
        <div class="label">${escapeHtml(content.eyebrow)}</div>
        <h3>${escapeHtml(content.heading)}</h3>
        <p>${escapeHtml(content.summary)}</p>
      </a>`;
    })
    .join("");
}

function metricsHtml(page, lang) {
  const labels = uiLabels[lang] || uiLabels.en;
  const content = page.i18n[lang] || page.i18n.en;
  const modules = page.modules[lang] || page.modules.en;
  const values = [
    [content.focus[0] || "Live", "Primary surface"],
    [modules[0] || "Scores", "Reusable module"],
    ["< 1.5s", "Fast page load target"],
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

function structuredData(page, lang) {
  const content = page.i18n[lang] || page.i18n.en;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    url: siteUrl(lang, page.path),
    description: content.summary,
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: "ScorecardX",
      url: siteUrl("en", "/")
    },
    about: content.focus.map((name) => ({ "@type": "Thing", name }))
  };
}

function pageHtml(page, lang) {
  const accent = sportAccents[page.accent] || sportAccents.other;
  const content = page.i18n[lang] || page.i18n.en;
  const labels = uiLabels[lang] || uiLabels.en;
  const modules = page.modules[lang] || page.modules.en;
  const jsonLd = JSON.stringify(structuredData(page, lang));
  const relatedHeading = page.path === "/" ? labels.featHubs : labels.relPages;
  const contentTable =
    page.path === "/calendar/"
      ? calendarHtml()
      : tableHtml(page.active === "Home" ? leagueRows : dataRows, ["Module", "Sport", "Quota", "Coverage", "Status"]);

  const hreflangs = Object.keys(languages)
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${siteUrl(l, page.path)}">`)
    .join("\n  ");

  return `<!doctype html>
<html lang="${lang}">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4ERJGDKYE8"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-4ERJGDKYE8');
  </script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8695398658548679" crossorigin="anonymous"></script>

  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(content.title)}</title>
  <meta name="description" content="${escapeHtml(content.summary)}">
  <link rel="canonical" href="${siteUrl(lang, page.path)}">
  ${hreflangs}
  <link rel="icon" href="${assetHrefFor("/favicon.svg", page.path, lang)}" type="image/svg+xml">
  <link rel="mask-icon" href="${assetHrefFor("/favicon.svg", page.path, lang)}" color="${accent}">
  <meta name="theme-color" content="#0f172a">
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
        <a class="brand" href="${hrefFor("/", page.path, lang)}">
          <span class="brand-mark">ScorecardX</span>
          <span class="brand-sub">${escapeHtml(labels.liveLayer)}</span>
        </a>
        <nav class="nav" aria-label="Primary navigation">${navHtml(page.active, accent, page.path, lang)}</nav>
        <label class="search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="${escapeHtml(labels.search)}">
        </label>
        ${langSwitchHtml(page.path, lang)}
      </div>
    </header>
    <main class="page">
      ${getAdHtml("zone_a")}
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">${escapeHtml(content.eyebrow)}</div>
          <h1>${escapeHtml(content.heading)}</h1>
          <p class="lead">${escapeHtml(content.summary)}</p>
          <div class="chip-row">${content.focus.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>
          <div class="hero-actions">
            ${(page.cta || [{ label: "Explore Calendar", href: "/calendar/" }, { label: "About Data", href: "/about/" }])
              .map((item, index) => `<a class="button ${index === 0 ? "primary" : ""}" href="${hrefFor(item.href, page.path, lang)}">${escapeHtml(item.label)}</a>`)
              .join("")}
          </div>
        </div>
        ${heroBoard(page, lang)}
      </section>
      ${tickerHtml()}
      ${providerHealthHtml()}
      <section class="section">
        <div class="section-head">
          <div>
            <div class="label">${escapeHtml(labels.perfLayer)}</div>
            <h2>${escapeHtml(labels.coverage)}</h2>
          </div>
        </div>
        <div class="grid metrics">${metricsHtml(page, lang)}</div>
      </section>
      <section class="section split">
        <div>
          <div class="section-head">
            <div>
              <div class="label">Data Surface</div>
              <h2>${page.path === "/calendar/" ? "Cross-Sport Schedule" : "Data Sources and Cadence"}</h2>
              <p>${page.path === "/calendar/" ? "Filter the consolidated calendar without leaving the page." : "Each module is refreshed on a predictable schedule with transparent provider status."}</p>
            </div>
          </div>
          ${contentTable}
        </div>
        <aside>
          <div class="section-head">
            <div>
              <div class="label">Modules</div>
              <h2>${escapeHtml(labels.readyComp)}</h2>
            </div>
          </div>
          <div class="grid">${modules
            .map(
              (module) => `<article class="card" style="--accent:${accent};min-height:120px">
              <h3>${escapeHtml(module)}</h3>
              <p>Prepared for live score snapshots, provider health, and focused sports discovery.</p>
            </article>`
            )
            .join("")}</div>
          ${getAdHtml("zone_b")}
        </aside>
      </section>
      <section class="section">
        <div class="section-head">
          <div>
            <div class="label">Scoreboard</div>
            <h2>Live, Cached, and Configuration-Aware Cards</h2>
            <p>Cards now come from the synchronized data layer and are deduplicated before rendering.</p>
          </div>
        </div>
        ${liveGridHtml(page)}
      </section>
      <section class="section split">
        <div>
          <div class="section-head">
            <div>
              <div class="label">Fixtures</div>
              <h2>Schedule Feed</h2>
            </div>
          </div>
          ${fixturesHtml(page)}
        </div>
        <aside>
          <div class="section-head">
            <div>
              <div class="label">Standings</div>
              <h2>Table / Rankings</h2>
            </div>
          </div>
          ${standingsHtml(page)}
        </aside>
      </section>
      <section class="section split">
        <div>
          <div class="section-head">
            <div>
              <div class="label">Players</div>
              <h2>Leaders and Form</h2>
            </div>
          </div>
          ${playerStatsHtml(page)}
        </div>
        <aside>
          <div class="section-head">
            <div>
              <div class="label">News</div>
              <h2>Latest Updates</h2>
            </div>
          </div>
          ${newsHtml(page)}
        </aside>
      </section>
      <section class="section">
        <div class="section-head">
          <div>
            <div class="label">${escapeHtml(labels.navMap)}</div>
            <h2>${escapeHtml(relatedHeading)}</h2>
          </div>
        </div>
        <div class="grid cards">${cardsHtml(page, page.path, lang)}</div>
      </section>
      ${getAdHtml("zone_c")}
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <span>ScorecardX live sports intelligence · refreshed throughout the day</span>
        <span>Cricket-first coverage with football, NBA, F1, tennis, and calendar views</span>
      </div>
    </footer>
  </div>
  <script>${appJs}</script>
</body>
</html>`;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

let pagesCount = 0;
for (const lang of Object.keys(languages)) {
  for (const page of pages) {
    const langPrefix = lang === "en" ? "" : lang;
    const pageTargetDir = join(dist, langPrefix, page.path);
    const filePath = join(pageTargetDir, "index.html");
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, pageHtml(page, lang));
    pagesCount++;
  }
}

await cp(publicDir, dist, { recursive: true });

await writeFile(
  join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: https://wolf0x0x.github.io/scorecardx/sitemap.xml\n`
);

await writeFile(
  join(dist, "ads.txt"),
  `google.com, pub-8695398658548679, DIRECT, f08c47fec0942fa0\n`
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(languages)
  .map((lang) => pages.map((page) => `  <url><loc>${siteUrl(lang, page.path)}</loc></url>`).join("\n"))
  .join("\n")}
</urlset>`;
await writeFile(join(dist, "sitemap.xml"), sitemap);
await writeFile(join(dist, ".nojekyll"), "");

console.log(`[ScorecardX成功] Generated ${pagesCount} multi-language pages into dist/`);
