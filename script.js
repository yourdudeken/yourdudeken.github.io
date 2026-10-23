/**
 * GitHub-powered developer portfolio
 * 100% static. All data fetched live from the GitHub REST API.
 * Zero mock data, zero hardcoded projects.
 */

(function () {
  "use strict";

  /* ============================================================
     Constants
     ============================================================ */
  const USERNAME = "yourdudeken";
  const API = "https://api.github.com";
  const MAX_PAGES = 10;
  const MAX_RECENT_EVENTS = 12;

  /** GitHub's official language color palette */
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
  const FALLBACK_COLOR = "#8b949e";

  /* ============================================================
     DOM helpers
     ============================================================ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /**
   * Create an element with attributes and children.
   * Supports `class`, `html` (innerHTML), `on<event>` handlers,
   * and arbitrary attributes. Falsy children are skipped.
   */
  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (val == null) continue;
      if (key === "class") node.className = val;
      else if (key === "html") node.innerHTML = val;
      else if (key.startsWith("on") && typeof val === "function")
        node.addEventListener(key.slice(2), val);
      else node.setAttribute(key, val);
    }
    for (const child of children) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function langColor(lang) {
    return (lang && LANG_COLORS[lang]) || FALLBACK_COLOR;
  }

  /* ============================================================
     State
     ============================================================ */
  const state = {
    repos: [],
    activeLang: "all",
    searchQuery: "",
    sort: "updated",
    events: [],
  };

  /* ============================================================
     API layer
     ============================================================ */
  async function ghFetch(url) {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (res.status === 403 || res.status === 429) throw new Error("rate_limit");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function fetchProfile() {
    return ghFetch(`${API}/users/${USERNAME}`);
  }

  async function fetchAllRepos() {
    const repos = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const batch = await ghFetch(
        `${API}/users/${USERNAME}/repos?per_page=100&page=${page}&sort=pushed&direction=desc`
      );
      if (!Array.isArray(batch) || batch.length === 0) break;
      repos.push(...batch);
      if (batch.length < 100) break;
    }
    return repos;
  }

  async function fetchRecentEvents() {
    const events = await ghFetch(
      `${API}/users/${USERNAME}/events/public?per_page=${MAX_RECENT_EVENTS}`
    );
    return Array.isArray(events) ? events : [];
  }

  /* ============================================================
     Formatting helpers
     ============================================================ */
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
    } catch {
      return "";
    }

    function fmtYear(iso) {
      try {
        return new Date(iso).getFullYear();
      } catch {
        return "";
      }
    }
  }

  function timeAgo(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days < 1) return "today";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  function pluralize(count, singular, plural = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function fmtSizeKiB(size) {
    if (!size && size !== 0) return "";
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} GB`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} MB`;
    return `${size} KB`;
  }

  /* ============================================================
     Icons (inline SVG strings)
     ============================================================ */
  const ICON = {
    star: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"></path></svg>',
    fork: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>',
    repo: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>',
    users: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M5.5 3.25a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5zM8 8a4 4 0 0 0-4 4v.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V12a4 4 0 0 0-4-4zm6.12-2.13a2.25 2.25 0 1 1-3.24 2.76 2.25 2.25 0 0 1 3.24-2.76z"></path></svg>',
    location: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M11.5 5.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1 0a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path><path d="M8 1a7 7 0 0 0-7 7c0 2.9 1.96 5.55 4.31 7.5l.001.001.69.55.69-.55C8.04 13.55 10 10.9 10 8a7 7 0 0 0-7-7Z"></path></svg>',
    link: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 1 .53-1.28 3.5 3.5 0 0 0 4.95 0l2.5-2.5a2.5 2.5 0 0 0-3.535-3.535l-1.25 1.25a.75.75 0 0 1-1.06-1.06Z"></path></svg>',
    org: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.5-1A.25.25 0 0 1 13 6.886V5.5a.75.75 0 0 1 1.5 0v.94l.89.593a1.75 1.75 0 0 1 .86 1.502v5.715A1.75 1.75 0 0 1 14.25 16h-3.5a.75.75 0 0 1-.197-.026c-.04.005-.083.005-.125.005a.75.75 0 0 1-.75-.75V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5ZM5 12.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
    twitter: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M9.5 6.5h4l-5.2 6 5.2 6.8h-4l-3.2-4-3.8 4H1.5l5.5-6.4L1.5 6.5h4.1l3 3.6 3-3.6Zm-.7 11.2h1L5.3 6.5H4.2l4.6 11.2Z"></path></svg>',
  };

  /* ============================================================
     Reveal-on-scroll
     ============================================================ */
  let revealObserver = null;

  function observeReveal() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );
    }
    $$(".reveal:not(.is-visible)").forEach((node) => revealObserver.observe(node));
  }

  /* ============================================================
     Render: Repo card (shared by Featured + Repositories)
     ============================================================ */
  function repoCard(repo) {
    const card = h("div", { class: "repo-card reveal" });

    // Top: name + fork badge + relative time
    const top = h("div", { class: "repo-card-top" },
      h("div", { class: "repo-name-wrap" },
        h("a", {
          class: "repo-name",
          href: repo.html_url,
          target: "_blank", rel: "noopener noreferrer",
        }, repo.name),
        repo.fork ? h("span", { class: "fork-badge" }, "Fork") : null
      )
    );
    if (repo.updated_at) {
      top.append(h("span", { class: "repo-updated" }, timeAgo(repo.updated_at)));
    }
    card.append(top);

    // Description (only if provided)
    if (repo.description) {
      card.append(h("p", { class: "repo-desc" }, repo.description));
    } else {
      card.append(h("p", { class: "repo-desc is-empty" }, "No description"));
    }

    // Meta: language dot, stars, forks
    const meta = h("div", { class: "repo-meta" });
    if (repo.language) {
      meta.append(
        h("span", { class: "repo-meta-item" },
          h("span", { class: "lang-dot", style: `background:${langColor(repo.language)}` }),
          repo.language
        )
      );
    }
    meta.append(
      h("span", { class: "repo-stars", html: ICON.star }, ` ${fmtNum(repo.stargazers_count || 0)}`),
      h("span", { class: "repo-forks", html: ICON.fork }, ` ${fmtNum(repo.forks_count || 0)}`)
    );
    card.append(meta);

    const details = h("div", { class: "repo-details" });
    details.append(
      h("span", { class: "repo-detail-chip" }, `Size: ${fmtSizeKiB(repo.size || 0)}`),
      h("span", { class: "repo-detail-chip" }, pluralize(repo.open_issues_count || 0, "open issue"))
    );
    if (repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION") {
      details.append(h("span", { class: "repo-detail-chip" }, `License: ${repo.license.spdx_id}`));
    }
    if (repo.homepage) {
      const normalized = repo.homepage.startsWith("http") ? repo.homepage : `https://${repo.homepage}`;
      details.append(
        h("a", {
          class: "repo-detail-chip repo-detail-chip-link",
          href: normalized,
          target: "_blank",
          rel: "noopener noreferrer",
        }, "Live site")
      );
    }
    card.append(details);

    if (Array.isArray(repo.topics) && repo.topics.length) {
      const topics = h("div", { class: "repo-topics" });
      repo.topics.slice(0, 5).forEach((topic) => {
        topics.append(h("span", { class: "repo-topic" }, topic));
      });
      card.append(topics);
    }

    // Footer: absolute date + view link
    card.append(
      h("div", { class: "repo-footer" },
        h("span", { class: "repo-updated" },
          repo.updated_at ? `Updated ${fmtDate(repo.updated_at)}` : ""
        ),
        h("a", {
          class: "btn btn-small",
          href: repo.html_url,
          target: "_blank", rel: "noopener noreferrer",
        }, "View")
      )
    );

    return card;
  }

  /* ============================================================
     Render: Hero
     ============================================================ */
  function renderHero(profile) {
    const host = $("#hero-content");
    host.innerHTML = "";
    const profileUrl = profile.html_url || `https://github.com/${profile.login}`;
    const displayName = profile.name || profile.login;

    document.title = `${displayName} — Developer Portfolio`;
    const brand = $("#brand-link");
    brand.href = profileUrl;
    brand.setAttribute("aria-label", `${displayName}'s GitHub profile`);
    brand.querySelector(".brand-text").textContent = profile.login;
    const footerLink = $("#footer-link");
    footerLink.href = profileUrl;
    footerLink.textContent = `github.com/${profile.login}`;

    host.append(
      h("img", {
        class: "hero-avatar",
        src: profile.avatar_url,
        alt: `${displayName}'s avatar`,
        width: 128, height: 128,
      }),
      h("h1", { class: "hero-name", id: "hero-name" }, displayName),
      h("div", { class: "hero-login" }, `@${profile.login}`)
    );

    if (profile.bio) {
      const bio = profile.bio.replace(/\r\n/g, "\n").trim();
      host.append(h("p", { class: "hero-bio" }, bio));
    }

    // Meta row: location, company, blog
    const meta = [];
    if (profile.location) {
      meta.push(h("span", { class: "hero-location", html: ICON.location }, ` ${profile.location}`));
    }
    if (profile.company) {
      meta.push(h("span", { class: "hero-company", html: ICON.org }, ` ${profile.company}`));
    }
    if (profile.blog) {
      const url = profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`;
      meta.push(
        h("span", { class: "hero-blog", html: ICON.link }, " ",
          h("a", { href: url, target: "_blank", rel: "noopener noreferrer" },
            profile.blog.replace(/^https?:\/\//, ""))
        )
      );
    }
    if (profile.twitter_username) {
      meta.push(
        h("span", { class: "hero-twitter", html: ICON.twitter }, " ",
          h("a", {
            href: `https://twitter.com/${profile.twitter_username}`,
            target: "_blank", rel: "noopener noreferrer",
          }, `@${profile.twitter_username}`)
        )
      );
    }
    if (meta.length) {
      host.append(h("div", { class: "hero-meta" }, ...meta));
    }

    // Stats row
    host.append(
      h("div", { class: "hero-stats" },
        h("span", { class: "hero-stat", html: ICON.repo }, " ",
          h("strong", {}, String(profile.public_repos ?? 0)), " repositories"),
        h("span", { class: "hero-stat", html: ICON.users }, " ",
          h("strong", {}, fmtNum(profile.followers)), " followers"),
        h("span", { class: "hero-stat", html: ICON.users }, " ",
          h("strong", {}, fmtNum(profile.following)), " following"),
        h("span", { class: "hero-stat" },
          h("strong", {}, fmtNum(profile.public_gists)), " public gists")
      ),
      h("div", { class: "hero-actions" },
        h("a", {
          class: "btn btn-primary",
          href: profileUrl,
          target: "_blank", rel: "noopener noreferrer",
          html: ICON.repo,
        }, " View GitHub Profile"),
        h("a", {
          class: "btn",
          href: "#repositories",
        }, " Explore the work")
      )
    );
  }

  function renderHeroError() {
    const host = $("#hero-content");
    host.innerHTML = "";
    host.append(
      h("div", { class: "status-msg error" },
        h("p", {}, "Unable to load GitHub profile."),
        h("p", { class: "subtext" },
          "The GitHub API rate limit may have been reached. Please try again in a few minutes."),
        h("a", {
          class: "btn",
          href: "https://github.com",
          target: "_blank", rel: "noopener noreferrer",
        }, "Visit GitHub Profile")
      )
    );
  }

  /* ============================================================
     Render: Repositories
     ============================================================ */
  function renderRepositories(repos) {
    $("#repo-status").innerHTML = "";
    $("#repo-status").hidden = true;

    state.repos = [...repos].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    buildLangChips(repos);
    $("#repo-controls").hidden = false;
    applyFilters();
  }

  function buildLangChips(repos) {
    const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))].sort();
    const chips = $("#lang-chips");
    chips.innerHTML = "";

    const makeChip = (label, lang) =>
      h("button", {
        class: `lang-chip ${state.activeLang === lang ? "is-active" : ""}`,
        onclick: () => { state.activeLang = lang; syncChipActive(); applyFilters(); },
      }, label);

    chips.append(makeChip("All", "all"));
    langs.forEach((lang) => chips.append(makeChip(lang, lang)));
  }

  function syncChipActive() {
    $$(".lang-chip").forEach((chip) => {
      const label = chip.textContent;
      const isActive =
        (label === "All" && state.activeLang === "all") || label === state.activeLang;
      chip.classList.toggle("is-active", isActive);
    });
  }

  function applyFilters() {
    const grid = $("#repo-grid");
    grid.innerHTML = "";

    const q = state.searchQuery;
    const filtered = state.repos.filter((repo) => {
      const matchesLang = state.activeLang === "all" || repo.language === state.activeLang;
      const name = (repo.name || "").toLowerCase();
      const desc = (repo.description || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || desc.includes(q);
      return matchesLang && matchesQuery;
    }).sort((a, b) => {
      if (state.sort === "stars") return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (state.sort === "name") return (a.name || "").localeCompare(b.name || "");
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    if (filtered.length === 0) {
      grid.append(
        h("div", { class: "empty-state" },
          h("strong", {}, "No repositories match your filters."),
          h("span", {}, "Try a different search or language.")
        )
      );
      return;
    }

    filtered.forEach((repo) => grid.append(repoCard(repo)));
    observeReveal();
  }

  function renderRepoError(err) {
    const status = $("#repo-status");
    status.innerHTML = "";
    status.append(
      h("div", { class: "status-msg error" },
        h("p", {}, "Unable to load repositories."),
        h("p", { class: "subtext" },
          err.message === "rate_limit"
            ? "GitHub API rate limit reached. Please try again in a few minutes."
            : "An error occurred while fetching repository data.")
      )
    );
  }

  /* ============================================================
     Render: Featured
     ============================================================ */
  function renderFeatured(repos) {
    if (!repos.length) {
      $("#featured").hidden = true;
      return;
    }

    // Rank by stars → forks → recency (exclude forks)
    const ranked = [...repos]
      .filter((r) => !r.fork)
      .sort(
        (a, b) =>
          (b.stargazers_count || 0) - (a.stargazers_count || 0) ||
          (b.forks_count || 0) - (a.forks_count || 0) ||
          new Date(b.updated_at) - new Date(a.updated_at)
      );

    const hasEngagement = ranked.some(
      (r) => (r.stargazers_count || 0) > 0 || (r.forks_count || 0) > 0
    );

    let top;
    if (hasEngagement) {
      top = ranked.slice(0, 6);
    } else {
      // No stars/forks anywhere — fall back to most recent repos
      top = [...repos]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);
    }

    if (!top.length) {
      $("#featured").hidden = true;
      return;
    }

    const grid = $("#featured-grid");
    grid.innerHTML = "";
    top.forEach((repo) => grid.append(repoCard(repo)));
    $("#featured").hidden = false;
    observeReveal();
  }

  function eventSummary(event) {
    const payload = event.payload || {};
    if (event.type === "PushEvent") {
     const commits = Array.isArray(payload.commits) ? payload.commits.length : 0;
     return `Pushed ${pluralize(commits, "commit")} to ${payload.ref ? payload.ref.replace("refs/heads/", "") : "branch"}`;
    }
    if (event.type === "PullRequestEvent") {
     return `${payload.action || "updated"} pull request #${payload.pull_request?.number || ""}`.trim();
    }
    if (event.type === "IssuesEvent") {
     return `${payload.action || "updated"} issue #${payload.issue?.number || ""}`.trim();
    }
    if (event.type === "IssueCommentEvent") {
     return `${payload.action || "updated"} an issue comment`;
    }
    if (event.type === "CreateEvent") {
     return `Created ${payload.ref_type || "resource"}${payload.ref ? ` ${payload.ref}` : ""}`;
    }
    if (event.type === "WatchEvent") {
     return "Starred a repository";
    }
    return event.type.replace(/Event$/, "");
  }

  function renderRecentWork(events) {
    const section = $("#recent-work");
    const feed = $("#work-feed");
    const status = $("#work-status");
    feed.innerHTML = "";
    status.innerHTML = "";

    const scoped = events
     .filter((event) => event?.repo?.name)
     .slice(0, MAX_RECENT_EVENTS);

    if (!scoped.length) {
     section.hidden = true;
     return;
    }

    scoped.forEach((event) => {
     const repoName = event.repo.name;
     const repoUrl = `https://github.com/${repoName}`;
     const action = eventSummary(event);
     const actor = event.actor?.display_login || event.actor?.login || "GitHub user";
     feed.append(
       h("article", { class: "work-card reveal" },
         h("div", { class: "work-top" },
           h("span", { class: "work-type" }, event.type.replace(/Event$/, "")),
           h("time", { class: "work-time", datetime: event.created_at || "" },
             event.created_at ? timeAgo(event.created_at) : "")
         ),
         h("h3", { class: "work-title" }, action),
         h("p", { class: "work-meta" },
           h("span", {}, actor),
           " • ",
           h("a", { href: repoUrl, target: "_blank", rel: "noopener noreferrer" }, repoName)
         )
       )
     );
    });

    const pushCount = scoped.filter((event) => event.type === "PushEvent").length;
    const prCount = scoped.filter((event) => event.type === "PullRequestEvent").length;
    const issueCount = scoped.filter((event) => event.type === "IssuesEvent" || event.type === "IssueCommentEvent").length;

    status.append(
     h("p", { class: "work-kpis" },
       `${pluralize(scoped.length, "event")} • ${pluralize(pushCount, "push")} • ${pluralize(prCount, "pull request")} • ${pluralize(issueCount, "issue interaction")}`
     )
    );

    section.hidden = false;
    observeReveal();
  }

  function renderWorkError(err) {
    const section = $("#recent-work");
    const status = $("#work-status");
    const feed = $("#work-feed");
    status.innerHTML = "";
    feed.innerHTML = "";
    status.append(
     h("div", { class: "status-msg error" },
       h("p", {}, "Unable to load recent GitHub activity."),
       h("p", { class: "subtext" },
         err.message === "rate_limit"
           ? "GitHub API rate limit reached. Please try again in a few minutes."
           : "An error occurred while fetching event data.")
     )
    );
    section.hidden = false;
  }

  /* ============================================================
     Render: Activity / Stats
     ============================================================ */
  function renderActivity(repos) {
    if (!repos.length) {
      $("#insights").hidden = true;
      return;
    }

    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
    const totalOpenIssues = repos.reduce((s, r) => s + (r.open_issues_count || 0), 0);
    const totalRepoSize = repos.reduce((s, r) => s + (r.size || 0), 0);
    const activeLast30d = repos.filter((r) => {
      if (!r.pushed_at) return false;
      return Date.now() - new Date(r.pushed_at).getTime() <= 30 * 86400000;
    }).length;
    const avgSize = repos.length ? Math.round(totalRepoSize / repos.length) : 0;

    const grid = $("#stats-grid");
    grid.innerHTML = "";
    grid.append(
      statCard(repos.length, "Public Repositories"),
      statCard(totalStars, "Total Stars"),
      statCard(totalForks, "Total Forks"),
      statCard(totalOpenIssues, "Open Issues"),
      statCard(activeLast30d, "Active Repos (30d)"),
      statCard(fmtSizeKiB(avgSize), "Avg Repo Size")
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
      const legend = $("#lang-legend");
      bar.innerHTML = "";
      legend.innerHTML = "";

      langEntries.forEach(([lang, count]) => {
        const pct = (count / totalLangs) * 100;
        bar.append(
          h("div", {
            class: "lang-segment",
            style: `width:${pct}%;background:${langColor(lang)}`,
            title: `${lang} ${pct.toFixed(1)}%`,
          })
        );
        legend.append(
          h("li", {},
            h("span", { class: "dot", style: `background:${langColor(lang)}` }),
            ` ${lang} `,
            h("span", { class: "pct" }, `${pct.toFixed(1)}%`)
          )
        );
      });

      $("#languages-block").hidden = false;
    }

    $("#insights").hidden = false;
  }

  function statCard(value, label) {
    return h("div", { class: "stat-card reveal" },
      h("div", { class: "stat-value" }, fmtNum(value)),
      h("div", { class: "stat-label" }, label)
    );
  }

  /* ============================================================
     Search
     ============================================================ */
  function initSearch() {
    const input = $("#repo-search");
    if (!input) return;
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.searchQuery = input.value.toLowerCase().trim();
        applyFilters();
      }, 180);
    });
    const sort = $("#repo-sort");
    sort?.addEventListener("change", () => {
      state.sort = sort.value;
      applyFilters();
    });
  }

  function initTheme() {
    const toggle = $("#theme-toggle");
    if (!toggle) return;
    const saved = localStorage.getItem("portfolio-theme");
    if (saved === "light") document.documentElement.dataset.theme = "light";
    const sync = () => {
      const light = document.documentElement.dataset.theme === "light";
      toggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
      toggle.querySelector(".theme-label").textContent = light ? "Dark" : "Light";
      toggle.querySelector(".theme-icon").textContent = light ? "☾" : "☼";
    };
    sync();
    toggle.addEventListener("click", () => {
      const light = document.documentElement.dataset.theme !== "light";
      document.documentElement.dataset.theme = light ? "light" : "dark";
      localStorage.setItem("portfolio-theme", light ? "light" : "dark");
      sync();
    });
  }

  /* ============================================================
     Init
     ============================================================ */
  async function init() {
    initSearch();
    initTheme();

    const [profileResult, reposResult, eventsResult] = await Promise.allSettled([
      fetchProfile(),
      fetchAllRepos(),
      fetchRecentEvents(),
    ]);

    // Hero
    if (profileResult.status === "fulfilled" && profileResult.value) {
      renderHero(profileResult.value);
    } else {
      renderHeroError();
    }

    // Repositories + Featured + Activity all depend on repos
    const repos =
      reposResult.status === "fulfilled" &&
      Array.isArray(reposResult.value) &&
      reposResult.value.length > 0
        ? reposResult.value
        : null;

    if (repos) {
      renderRepositories(repos);
      renderFeatured(repos);
      renderActivity(repos);
    } else {
      const err =
        reposResult.status === "rejected" ? reposResult.reason : new Error("empty");
      renderRepoError(err);
      $("#featured").hidden = true;
      $("#insights").hidden = true;
    }

    if (eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value)) {
      state.events = eventsResult.value;
      renderRecentWork(eventsResult.value);
    } else {
      const err =
        eventsResult.status === "rejected" ? eventsResult.reason : new Error("empty");
      renderWorkError(err);
    }

    observeReveal();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
