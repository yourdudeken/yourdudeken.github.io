/**
 * yourdudeken — Developer Portfolio
 * 100% static. All data fetched live from the GitHub REST API.
 * Zero mock data, zero hardcoded projects.
 */

const USERNAME = "yourdudeken";
const API = "https://api.github.com";

/* ---------- GitHub language colors (GitHub's official palette) ---------- */
const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", HTML: "#e34c26",
  CSS: "#563d7c", Java: "#b07219", Ruby: "#701516", PHP: "#4F5D95", Go: "#00ADD8",
  Rust: "#dea584", C: "#555555", "C++": "#f34b7d", CSharp: "#178600", Shell: "#89e051",
  Vue: "#41b883", Svelte: "#ff3e00", Dart: "#00B4AB", Kotlin: "#A97BFF", Swift: "#F05138",
  Dockerfile: "#384d54", Makefile: "#427819", Jupyter: "#DA5B0B", SCSS: "#c6538c",
  Lua: "#000080", Perl: "#0298c3", Haskell: "#5e5086", Elixir: "#6e4a7e", Clojure: "#db5855",
  Zig: "#ec915c", Nim: "#ffc200", R: "#198CE7", Julia: "#a270ba", Scala: "#c22d40",
  Emacs: "#c065db", PowerShell: "#012456", Batchfile: "#C1F12E", Assembly: "#6E4C13",
};

function langColor(lang) {
  if (!lang) return "#8b949e";
  return LANG_COLORS[lang] || "#8b949e";
}

/* ---------- Tiny DOM helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
};

/* ---------- State ---------- */
let allRepos = [];
let activeLang = "all";
let searchQuery = "";

/* ---------- API layer ---------- */
async function ghFetch(url) {
  const res = await fetch(url);
  if (res.status === 403 || res.status === 429) {
    throw new Error("rate_limit");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchProfile() {
  return ghFetch(`${API}/users/${USERNAME}`);
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  // Page up to 10 pages (1000 repos) max — protects against infinite loops.
  while (page <= 10) {
    const batch = await ghFetch(
      `${API}/users/${USERNAME}/repos?per_page=100&page=${page}&sort=pushed&direction=desc`
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break; // last page
    page++;
  }
  return repos;
}

/* ---------- Formatting helpers ---------- */
function fmtNum(n) {
  if (n == null) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return ""; }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/* ---------- Icons ---------- */
const ICON = {
  star: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"></path></svg>',
  fork: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>',
  repo: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>',
  users: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M5.5 3.25a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5zM8 8a4 4 0 0 0-4 4v.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V12a4 4 0 0 0-4-4zm6.12-2.13a2.25 2.25 0 1 1-3.24 2.76 2.25 2.25 0 0 1 3.24-2.76z"></path></svg>',
  book: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.5c.342 0 .68.115.95.326L8 3.31l1.8-1.584A1.5 1.5 0 0 1 10.75 1h4.5A.75.75 0 0 1 16 1.75v12.5a.75.75 0 0 1-.75.75h-4.5a.5.5 0 0 0-.356.146L8 16l-2.394-1.854A.5.5 0 0 0 5.25 14H.75a.75.75 0 0 1-.75-.75Z"></path></svg>',
  location: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M11.5 5.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1 0a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path><path d="M8 1a7 7 0 0 0-7 7c0 2.9 1.96 5.55 4.31 7.5l.001.001.69.55.69-.55C8.04 13.55 10 10.9 10 8a7 7 0 0 0-7-7Z"></path></svg>',
  link: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 1 .53-1.28 3.5 3.5 0 0 0 4.95 0l2.5-2.5a2.5 2.5 0 0 0-3.535-3.535l-1.25 1.25a.75.75 0 0 1-1.06-1.06Z"></path></svg>',
  org: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.5-1A.25.25 0 0 1 13 6.886V5.5a.75.75 0 0 1 1.5 0v.94l.89.593a1.75 1.75 0 0 1 .86 1.502v5.715A1.75 1.75 0 0 1 14.25 16h-3.5a.75.75 0 0 1-.197-.026c-.04.005-.083.005-.125.005a.75.75 0 0 1-.75-.75V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5ZM5 12.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
};

/* ---------- Render: Hero ---------- */
function renderHero(profile) {
  const skeleton = $("#hero-skeleton");
  if (skeleton) skeleton.remove();

  const hero = $("#hero-content");
  hero.innerHTML = "";

  const avatar = el("img", {
    class: "hero-avatar",
    src: profile.avatar_url,
    alt: `${profile.name || profile.login}'s avatar`,
    width: 128, height: 128,
  });

  const name = el("h1", { class: "hero-name", id: "hero-name" }, profile.name || profile.login);
  const login = el("div", { class: "hero-login" }, `@${profile.login}`);

  const children = [avatar, name, login];

  if (profile.bio) {
    children.push(el("p", { class: "hero-bio" }, profile.bio));
  }

  // Meta row: location, company, blog
  const meta = [];
  if (profile.location) {
    meta.push(el("span", { class: "hero-location", html: ICON.location }, ` ${profile.location}`));
  }
  if (profile.company) {
    meta.push(el("span", { class: "hero-company", html: ICON.org }, ` ${profile.company}`));
  }
  if (profile.blog) {
    const url = profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`;
    meta.push(el("span", { class: "hero-blog", html: ICON.link }, " ", el("a", {
      href: url, target: "_blank", rel: "noopener noreferrer",
    }, profile.blog.replace(/^https?:\/\//, ""))));
  }
  if (meta.length) {
    children.push(el("div", { class: "hero-meta" }, ...meta));
  }

  // Stats row
  const stats = el("div", { class: "hero-stats" },
    el("span", { class: "hero-stat", html: ICON.repo }, " ", el("strong", {}, String(profile.public_repos ?? 0)), " repositories"),
    el("span", { class: "hero-stat", html: ICON.users }, " ", el("strong", {}, fmtNum(profile.followers)), " followers"),
    el("span", { class: "hero-stat", html: ICON.users }, " ", el("strong", {}, fmtNum(profile.following)), " following"),
  );
  children.push(stats);

  // Actions
  children.push(el("div", { class: "hero-actions" },
    el("a", {
      class: "btn btn-primary",
      href: profile.html_url,
      target: "_blank", rel: "noopener noreferrer",
      html: ICON.repo,
    }, " View GitHub Profile"),
  ));

  children.forEach((c) => hero.append(c));
}

function renderHeroError() {
  const skeleton = $("#hero-skeleton");
  if (skeleton) skeleton.remove();
  const hero = $("#hero-content");
  hero.innerHTML = "";
  hero.append(el("div", { class: "status-msg error" },
    el("p", {}, "Unable to load GitHub profile."),
    el("p", { style: "font-size:13px" }, "The GitHub API rate limit may have been reached. Please try again in a few minutes."),
    el("a", { class: "btn", href: `https://github.com/${USERNAME}`, target: "_blank", rel: "noopener noreferrer" }, "Visit GitHub Profile"),
  ));
}

/* ---------- Render: Repo card ---------- */
function repoCard(repo) {
  const card = el("div", { class: "repo-card reveal" });

  // Top row: name + updated
  const top = el("div", { class: "repo-card-top" },
    el("a", {
      class: "repo-name",
      href: repo.html_url,
      target: "_blank", rel: "noopener noreferrer",
    }, repo.name),
  );

  if (repo.updated_at) {
    top.append(el("span", { class: "repo-updated" }, timeAgo(repo.updated_at)));
  }

  card.append(top);

  // Description (only if present)
  if (repo.description) {
    card.append(el("p", { class: "repo-desc" }, repo.description));
  } else {
    card.append(el("p", { class: "repo-desc", style: "color:var(--text-faint);font-style:italic" }, "No description"));
  }

  // Meta: language, stars, forks
  const meta = el("div", { class: "repo-meta" });
  if (repo.language) {
    meta.append(el("span", { class: "repo-meta-item" },
      el("span", { class: "lang-dot", style: `background:${langColor(repo.language)}` }),
      repo.language,
    ));
  }
  meta.append(el("span", { class: "repo-stars", html: ICON.star }, ` ${fmtNum(repo.stargazers_count || 0)}`));
  meta.append(el("span", { class: "repo-forks", html: ICON.fork }, ` ${fmtNum(repo.forks_count || 0)}`));
  card.append(meta);

  // Footer: updated date + link
  card.append(el("div", { class: "repo-footer" },
    el("span", { class: "repo-updated" }, repo.updated_at ? `Updated ${fmtDate(repo.updated_at)}` : ""),
    el("a", {
      class: "btn btn-small",
      href: repo.html_url,
      target: "_blank", rel: "noopener noreferrer",
    }, "View "),
  ));

  return card;
}

/* ---------- Render: Repositories ---------- */
function renderRepositories(repos) {
  const grid = $("#repo-grid");
  const status = $("#repo-status");
  status.innerHTML = "";
  status.hidden = true;
  grid.innerHTML = "";

  // Sort by last updated (already sorted from API, but enforce)
  const sorted = [...repos].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Build language chips
  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))].sort();
  const chips = $("#lang-chips");
  chips.innerHTML = "";
  chips.append(el("button", {
    class: `lang-chip ${activeLang === "all" ? "is-active" : ""}`,
    onclick: () => { activeLang = "all"; refreshChips(); applyFilters(); },
  }, "All"));
  langs.forEach((lang) => {
    chips.append(el("button", {
      class: `lang-chip ${activeLang === lang ? "is-active" : ""}`,
      onclick: () => { activeLang = lang; refreshChips(); applyFilters(); },
    }, lang));
  });

  $("#repo-controls").hidden = false;

  allRepos = sorted;
  applyFilters();
}

function refreshChips() {
  document.querySelectorAll(".lang-chip").forEach((chip) => {
    const label = chip.textContent;
    chip.classList.toggle("is-active", (label === "All" && activeLang === "all") || label === activeLang);
  });
}

function applyFilters() {
  const grid = $("#repo-grid");
  grid.innerHTML = "";

  const filtered = allRepos.filter((repo) => {
    const matchesLang = activeLang === "all" || repo.language === activeLang;
    const name = (repo.name || "").toLowerCase();
    const desc = (repo.description || "").toLowerCase();
    const matchesQuery = !searchQuery || name.includes(searchQuery) || desc.includes(searchQuery);
    return matchesLang && matchesQuery;
  });

  if (filtered.length === 0) {
    grid.append(el("div", { class: "empty-state" }, "No repositories match your filters."));
    return;
  }

  filtered.forEach((repo) => grid.append(repoCard(repo)));
  observeReveal();
}

function renderRepoError(err) {
  const status = $("#repo-status");
  status.innerHTML = "";
  const msg = el("div", { class: "status-msg error" },
    el("p", {}, "Unable to load repositories."),
    el("p", { style: "font-size:13px" },
      err.message === "rate_limit"
        ? "GitHub API rate limit reached. Please try again in a few minutes."
        : "An error occurred while fetching repository data."),
  );
  status.append(msg);
}

/* ---------- Render: Featured ---------- */
function renderFeatured(repos) {
  if (!repos.length) {
    $("#featured").hidden = true;
    return;
  }

  // Rank by stars, then forks, then recency
  const ranked = [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) =>
      (b.stargazers_count || 0) - (a.stargazers_count || 0) ||
      (b.forks_count || 0) - (a.forks_count || 0) ||
      new Date(b.updated_at) - new Date(a.updated_at)
    );

  const top = ranked.slice(0, 6);

  if (top.length === 0 || top.every((r) => (r.stargazers_count || 0) === 0 && (r.forks_count || 0) === 0)) {
    // No stars/forks anywhere — still show top 3 by recency so the section isn't empty
    const recent = [...repos].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 3);
    if (recent.length === 0) { $("#featured").hidden = true; return; }
    fillFeatured(recent);
    return;
  }

  fillFeatured(top);
}

function fillFeatured(list) {
  const grid = $("#featured-grid");
  grid.innerHTML = "";
  list.forEach((repo) => grid.append(repoCard(repo)));
  $("#featured").hidden = false;
  observeReveal();
}

/* ---------- Render: Activity / Stats ---------- */
function renderActivity(repos) {
  if (!repos.length) { $("#activity").hidden = true; return; }

  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);

  const grid = $("#stats-grid");
  grid.innerHTML = "";
  grid.append(
    statCard(repos.length, "Public Repositories"),
    statCard(totalStars, "Total Stars"),
    statCard(totalForks, "Total Forks"),
  );

  // Most used languages
  const langCounts = {};
  repos.forEach((r) => {
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });
  const langEntries = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

  if (langEntries.length > 0) {
    const totalLangs = langEntries.reduce((s, [, c]) => s + c, 0);
    const bar = $("#lang-bar");
    bar.innerHTML = "";
    const legend = $("#lang-legend");
    legend.innerHTML = "";

    langEntries.forEach(([lang, count]) => {
      const pct = (count / totalLangs) * 100;
      bar.append(el("div", {
        class: "lang-segment",
        style: `width:${pct}%;background:${langColor(lang)}`,
        title: `${lang} ${pct.toFixed(1)}%`,
      }));
      legend.append(el("li", {},
        el("span", { class: "dot", style: `background:${langColor(lang)}` }),
        ` ${lang} `,
        el("span", { class: "pct" }, `${pct.toFixed(1)}%`),
      ));
    });

    $("#languages-block").hidden = false;
  }

  $("#activity").hidden = false;
}

function statCard(value, label) {
  return el("div", { class: "stat-card reveal" },
    el("div", { class: "stat-value" }, fmtNum(value)),
    el("div", { class: "stat-label" }, label),
  );
}

/* ---------- Reveal on scroll ---------- */
let revealObserver = null;
function observeReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  }
  document.querySelectorAll(".reveal:not(.is-visible)").forEach((node) => revealObserver.observe(node));
}

/* ---------- Search ---------- */
function initSearch() {
  const input = $("#repo-search");
  if (!input) return;
  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      searchQuery = input.value.toLowerCase().trim();
      applyFilters();
    }, 180);
  });
}

/* ---------- Init ---------- */
async function init() {
  initSearch();

  // Fetch profile and repos in parallel
  const [profileResult, reposResult] = await Promise.allSettled([
    fetchProfile(),
    fetchAllRepos(),
  ]);

  // Hero
  if (profileResult.status === "fulfilled" && profileResult.value) {
    renderHero(profileResult.value);
  } else {
    renderHeroError();
  }

  // Repositories + Featured + Activity all depend on repos
  if (reposResult.status === "fulfilled" && Array.isArray(reposResult.value) && reposResult.value.length > 0) {
    const repos = reposResult.value;
    renderRepositories(repos);
    renderFeatured(repos);
    renderActivity(repos);
  } else {
    const err = reposResult.status === "rejected" ? reposResult.reason : new Error("empty");
    renderRepoError(err);
    // Hide dependent sections if we have no repo data
    $("#featured").hidden = true;
    $("#activity").hidden = true;
  }

  observeReveal();
}

document.addEventListener("DOMContentLoaded", init);
