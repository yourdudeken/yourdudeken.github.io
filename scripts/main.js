/**
 * Personal Portfolio Site - Main JavaScript
 * Handles theme switching, navigation, GitHub API integration,
 * scroll reveal animations, README viewer, and full activity feed.
 */

// ===== CONFIGURATION =====
const CONFIG = {
  github: {
    username: "yourdudeken",
    apiUrl: "https://api.github.com",
    cacheTTL: 10 * 60 * 1000, // 10 minutes
  },
  animations: {
    observerOptions: {
      threshold: 0.1,
      rootMargin: "0px 0px -60px 0px",
    },
  },
}

// ===== THEME MANAGEMENT =====
class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById("theme-toggle")
    this.themeIcon = this.themeToggle?.querySelector(".theme-icon")
    this.currentTheme = this.getStoredTheme() || this.getPreferredTheme()

    this.init()
  }

  init() {
    this.applyTheme(this.currentTheme)
    this.bindEvents()
  }

  getStoredTheme() {
    return localStorage.getItem("theme")
  }

  getPreferredTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme)
    this.updateThemeIcon(theme)
    localStorage.setItem("theme", theme)
    this.currentTheme = theme
  }

  updateThemeIcon(theme) {
    if (this.themeIcon) {
      const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      this.themeIcon.innerHTML = theme === "dark" ? sunIcon : moonIcon;
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark"
    this.applyTheme(newTheme)
  }

  bindEvents() {
    this.themeToggle?.addEventListener("click", () => this.toggleTheme())

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!this.getStoredTheme()) {
        this.applyTheme(e.matches ? "dark" : "light")
      }
    })
  }
}

// ===== NAVIGATION =====
class NavigationManager {
  constructor() {
    this.navLinks = document.querySelectorAll(".nav-link")
    this.sections = document.querySelectorAll("section[id]")
    this.nav = document.querySelector(".nav")
    this.navToggle = document.getElementById("nav-toggle")
    this.navLinksContainer = document.querySelector(".nav-links")

    this.init()
  }

  init() {
    this.bindEvents()
    this.handleScroll()
  }

  bindEvents() {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetId = link.getAttribute("href")
        const targetSection = document.querySelector(targetId)

        if (targetSection) {
          const offsetTop = targetSection.offsetTop - 80
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          })
        }

        // Close mobile menu
        this.navLinksContainer?.classList.remove("open")
        this.navToggle?.setAttribute("aria-expanded", "false")
      })
    })

    window.addEventListener("scroll", () => this.handleScroll(), { passive: true })

    this.navToggle?.addEventListener("click", () => {
      const isOpen = this.navLinksContainer?.classList.toggle("open")
      this.navToggle.setAttribute("aria-expanded", String(!!isOpen))
    })
  }

  handleScroll() {
    const scrollY = window.scrollY

    if (scrollY > 50) {
      this.nav?.classList.add("scrolled")
    } else {
      this.nav?.classList.remove("scrolled")
    }

    this.updateActiveNavLink()
  }

  updateActiveNavLink() {
    const scrollY = window.scrollY + 150
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    if (window.scrollY + windowHeight >= documentHeight - 20) {
      this.navLinks.forEach((link) => {
        link.classList.remove("active")
        if (link.getAttribute("href") === "#contact") {
          link.classList.add("active")
        }
      })
      return
    }

    this.sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute("id")

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        this.navLinks.forEach((link) => {
          link.classList.remove("active")
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active")
          }
        })
      }
    })
  }
}

// ===== GITHUB API INTEGRATION =====
class GitHubAPI {
  constructor() {
    this.baseUrl = CONFIG.github.apiUrl
    this.username = CONFIG.github.username
    this.cache = new Map()
    this.rateLimitExceeded = false
    this.cacheTTL = CONFIG.github.cacheTTL
  }

  getFromStorage(key) {
    try {
      const raw = localStorage.getItem(`gh_cache:${key}`)
      if (!raw) return null
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts > this.cacheTTL) {
        localStorage.removeItem(`gh_cache:${key}`)
        return null
      }
      return data
    } catch { return null }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(`gh_cache:${key}`, JSON.stringify({ data, ts: Date.now() }))
    } catch { /* quota — ignore */ }
  }

  async fetchWithCache(url, cacheKey) {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const stored = this.getFromStorage(cacheKey)
    if (stored) {
      this.cache.set(cacheKey, stored)
      return stored
    }

    try {
      const response = await fetch(url)

      if (response.status === 403) {
        console.warn("GitHub API rate limit exceeded, using fallback data")
        this.rateLimitExceeded = true
        return null
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.cache.set(cacheKey, data)
      this.saveToStorage(cacheKey, data)
      return data
    } catch (error) {
      console.error("GitHub API fetch error:", error)
      return null
    }
  }

  async getRepositories() {
    if (this.rateLimitExceeded) {
      return []
    }

    const url = `${this.baseUrl}/users/${this.username}/repos?sort=pushed&per_page=100`
    const repos = await this.fetchWithCache(url, "repositories")

    if (!repos) return []

    return repos.filter(repo => !repo.fork && repo.name !== 'yourdudeken' && repo.name !== 'yourdudeken.github.io') || []
  }

  async getUserProfile() {
    if (this.rateLimitExceeded) return null
    const url = `${this.baseUrl}/users/${this.username}`
    return await this.fetchWithCache(url, "user_profile")
  }

  async getContributionEvents() {
    if (this.rateLimitExceeded) {
      return []
    }

    const allEvents = []
    for (let page = 1; page <= 3; page++) {
      const url = `${this.baseUrl}/users/${this.username}/events/public?per_page=100&page=${page}`
      const events = await this.fetchWithCache(url, `events_p${page}`)
      if (!events || events.length === 0) break
      allEvents.push(...events)
    }

    return allEvents
  }

  async getReadme(repoName) {
    if (this.rateLimitExceeded) {
      return null
    }

    const branches = ["main", "master"]
    for (const branch of branches) {
      const url = `${this.baseUrl}/repos/${this.username}/${repoName}/readme?ref=${branch}`
      try {
        const response = await fetch(url, { headers: { Accept: "application/vnd.github.raw" } })

        if (response.status === 403) {
          this.rateLimitExceeded = true
          return null
        }
        if (!response.ok) continue

        const markdown = await response.text()
        if (markdown && typeof marked !== "undefined") {
          return marked.parse(markdown)
        }
        return markdown || null
      } catch (error) {
        console.error(`Error fetching README for ${repoName}:`, error)
      }
    }
    return null
  }

  stripEmojis(text) {
    if (!text) return ""
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu, '')
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  timeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

// ===== STATS MANAGER =====
class StatsManager {
  constructor(githubAPI) {
    this.githubAPI = githubAPI
    this.statEls = {
      repos: document.querySelector('[data-stat="repos"]'),
      stars: document.querySelector('[data-stat="stars"]'),
      followers: document.querySelector('[data-stat="followers"]'),
    }
  }

  async update() {
    if (!this.statEls.repos) return
    const [repos, profile] = await Promise.all([
      this.githubAPI.getRepositories(),
      this.githubAPI.getUserProfile(),
    ])

    if (repos && repos.length > 0) {
      const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
      this.animateNumber(this.statEls.repos, repos.length)
      this.animateNumber(this.statEls.stars, stars)
    }

    if (profile && profile.followers != null) {
      this.animateNumber(this.statEls.followers, profile.followers)
    } else if (this.statEls.followers) {
      this.statEls.followers.textContent = "67"
    }
  }

  animateNumber(el, target) {
    if (!el) return
    const duration = 900
    const start = performance.now()
    const startVal = 0

    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(startVal + (target - startVal) * eased)
      if (progress < 1) requestAnimationFrame(step)
      else el.textContent = target
    }
    requestAnimationFrame(step)
  }
}

// ===== PROJECT DISPLAY MANAGER =====
class ProjectManager {
  constructor(opts = {}) {
    this.githubAPI = opts.githubAPI || new GitHubAPI()
    this.readmeViewer = opts.readmeViewer || null
    this.projectFilter = opts.projectFilter || null
    this.projectsGrid = document.getElementById("projects-grid")
    this.statsManager = new StatsManager(this.githubAPI)
    this.repos = []

    this.init()
  }

  async init() {
    this.bindWorkReadmeButtons()
    await this.loadProjects()
    this.statsManager.update()
  }

  bindWorkReadmeButtons() {
    document.querySelectorAll("#work [data-readme]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const repoName = btn.dataset.readme
        const displayName = btn.dataset.displayName || repoName
        this.readmeViewer?.open(repoName, displayName)
      })
    })
  }

  clearSkeletons(container) {
    container?.querySelectorAll(".skeleton-card").forEach(el => el.remove())
  }

  async loadProjects() {
    if (!this.projectsGrid) return

    try {
      const repos = await this.githubAPI.getRepositories()
      if (repos && repos.length > 0) {
        this.repos = repos
        this.renderProjects(repos)
        if (this.projectFilter) this.projectFilter.setRepos(repos)
      } else {
        this.renderProjectsFallback()
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      this.renderProjectsFallback()
    }
  }

  renderProjects(repos) {
    this.clearSkeletons(this.projectsGrid)
    this.projectsGrid.innerHTML = repos.map((repo) => this.createProjectCard(repo)).join("")
    this.bindReadmeButtons()
    document.dispatchEvent(new CustomEvent("content:rendered"))
  }

  bindReadmeButtons() {
    if (!this.readmeViewer) return
    this.projectsGrid.querySelectorAll("[data-readme]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const repoName = btn.dataset.readme
        const displayName = btn.dataset.displayName || repoName
        this.readmeViewer.open(repoName, displayName)
      })
    })
  }

  createProjectCard(repo) {
    const topics = repo.topics || []
    const primaryTopics = topics.slice(0, 3)
    const name = this.githubAPI.stripEmojis(repo.name)
    const description = this.githubAPI.stripEmojis(repo.description || "No description available.")

    return `
      <div class="project-card fade-in-up">
        <div class="project-content">
          <h3 class="project-title">${name}</h3>
          <p class="project-description">${description}</p>
          <div class="project-tech">
            ${repo.language ? `<span class="tech-tag">${repo.language}</span>` : ""}
            ${primaryTopics.map((topic) => `<span class="tech-tag">${topic}</span>`).join("")}
          </div>
          <div class="project-actions">
            <a href="${repo.html_url}" class="btn btn-small" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
            <button class="btn btn-small btn-secondary" data-readme="${repo.name}" data-display-name="${name}">
              Read README
            </button>
          </div>
        </div>
      </div>
    `
  }

  renderProjectsFallback() {
    this.clearSkeletons(this.projectsGrid)
    this.projectsGrid.innerHTML = `
      <div class="project-card fade-in-up" style="grid-column: 1 / -1; text-align: center; border-style: dashed; box-shadow: none; background: transparent;">
        <div class="project-content">
          <h3 class="project-title">Projects Unavailable</h3>
          <p class="project-description">Unable to load repositories from GitHub at the moment. Please visit my profile directly to see my open source work.</p>
          <div class="project-actions" style="justify-content: center;">
            <a href="https://github.com/${CONFIG.github.username}" class="btn btn-small" target="_blank" rel="noopener noreferrer">
              View GitHub Profile
            </a>
          </div>
        </div>
      </div>
    `
  }
}

// ===== ACTIVITY FEED MANAGER =====
class ActivityFeedManager {
  constructor(githubAPI) {
    this.githubAPI = githubAPI
    this.container = document.getElementById("activity-feed")
    this.init()
  }

  async init() {
    if (!this.container) return
    await this.load()
  }

  async load() {
    try {
      const events = await this.githubAPI.getContributionEvents()
      if (!events || events.length === 0) {
        this.renderEmpty()
        return
      }
      this.render(events)
    } catch (error) {
      console.error("Error loading activity feed:", error)
      this.renderEmpty()
    }
  }

  clearSkeletons() {
    this.container?.querySelectorAll(".skeleton-card").forEach(el => el.remove())
  }

  iconFor(type) {
    const icons = {
      PushEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"></path><path d="M8 6l4-4 4 4"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path></svg>',
      PullRequestEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M6 9v6"></path><circle cx="18" cy="18" r="3"></circle><path d="M18 9v3a3 3 0 0 1-3 3h-6"></path></svg>',
      CreateEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
      IssuesEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>',
      ReleaseEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7L9 18l-5-5"></path></svg>',
      ForkEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M6 9v6"></path><path d="M18 9v3a3 3 0 0 1-3 3h-6"></path></svg>',
      WatchEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
      IssueCommentEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      CommitCommentEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>',
      PublicEvent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    }
    return icons[type] || icons.CreateEvent
  }

  describeEvent(event) {
    const repo = event.repo?.name || ""
    const repoShort = repo.replace(`${CONFIG.github.username}/`, "")
    const repoUrl = `https://github.com/${repo}`
    const repoLink = `<a href="${repoUrl}" target="_blank" rel="noopener noreferrer">${repoShort}</a>`
    const time = this.githubAPI.timeAgo(event.created_at)

    let title = ""
    let detail = ""
    let commitsHtml = ""

    switch (event.type) {
      case "PushEvent": {
        const count = event.payload?.commits?.length || 1
        const ref = event.payload?.ref?.replace("refs/heads/", "") || ""
        title = `Pushed ${count} commit${count !== 1 ? "s" : ""} to <code>${ref}</code> in ${repoLink}`
        const commitList = (event.payload?.commits || []).slice(0, 3)
        if (commitList.length > 0) {
          commitsHtml = `<div class="activity-item-commits">${commitList.map(c => {
            const hash = (c.sha || "").substring(0, 7)
            const msg = this.githubAPI.stripEmojis(c.message || "").split("\n")[0]
            return `<div class="activity-commit"><span class="commit-hash">${hash}</span><span class="commit-msg">${msg}</span></div>`
          }).join("")}</div>`
        }
        break
      }
      case "PullRequestEvent": {
        const action = event.payload?.action || "updated"
        const prTitle = this.githubAPI.stripEmojis(event.payload?.pull_request?.title || "")
        const prNumber = event.payload?.pull_request?.number || ""
        title = `${action.charAt(0).toUpperCase() + action.slice(1)} pull request #${prNumber} in ${repoLink}`
        if (prTitle) detail = prTitle
        break
      }
      case "CreateEvent": {
        const refType = event.payload?.ref_type || "repository"
        const ref = event.payload?.ref || ""
        title = ref === ""
          ? `Created ${refType} ${repoLink}`
          : `Created ${refType} <code>${ref}</code> in ${repoLink}`
        break
      }
      case "IssuesEvent": {
        const action = event.payload?.action || "updated"
        const issueTitle = this.githubAPI.stripEmojis(event.payload?.issue?.title || "")
        const issueNumber = event.payload?.issue?.number || ""
        title = `${action.charAt(0).toUpperCase() + action.slice(1)} issue #${issueNumber} in ${repoLink}`
        if (issueTitle) detail = issueTitle
        break
      }
      case "ReleaseEvent": {
        const releaseName = this.githubAPI.stripEmojis(event.payload?.release?.name || "")
        const tagName = event.payload?.release?.tag_name || ""
        title = `Published release ${repoLink}`
        if (releaseName || tagName) detail = `${tagName}${releaseName && releaseName !== tagName ? ` — ${releaseName}` : ""}`
        break
      }
      case "ForkEvent": {
        title = `Forked ${repoLink}`
        break
      }
      case "WatchEvent": {
        title = `Starred ${repoLink}`
        break
      }
      case "IssueCommentEvent": {
        const issueNumber = event.payload?.issue?.number || ""
        title = `Commented on issue #${issueNumber} in ${repoLink}`
        break
      }
      case "CommitCommentEvent": {
        title = `Commented on a commit in ${repoLink}`
        break
      }
      case "PublicEvent": {
        title = `Made ${repoLink} public`
        break
      }
      default: {
        title = `Activity in ${repoLink}`
      }
    }

    return { title, detail, commitsHtml, time }
  }

  render(events) {
    this.clearSkeletons()

    const html = events.slice(0, 30).map((event, i) => {
      const { title, detail, commitsHtml, time } = this.describeEvent(event)
      const icon = this.iconFor(event.type)
      const delay = Math.min(i * 0.04, 0.8)

      return `
        <div class="activity-item" style="animation-delay: ${delay}s;">
          <div class="activity-item-icon">${icon}</div>
          <div class="activity-item-body">
            <div class="activity-item-title">${title}</div>
            <div class="activity-item-meta">
              <span class="repo-name">${event.type.replace("Event", "")}</span>
              <span class="dot"></span>
              <span>${time}</span>
            </div>
            ${detail ? `<div class="activity-item-detail">${detail}</div>` : ""}
            ${commitsHtml}
          </div>
        </div>
      `
    }).join("")

    this.container.innerHTML = html
    document.dispatchEvent(new CustomEvent("content:rendered"))
  }

  renderEmpty() {
    this.clearSkeletons()
    this.container.innerHTML = `
      <div class="activity-empty">
        <p>No recent public activity to display.</p>
        <p><a href="https://github.com/${CONFIG.github.username}" target="_blank" rel="noopener noreferrer">View GitHub profile →</a></p>
      </div>
    `
  }
}

// ===== ANIMATION MANAGER =====
class AnimationManager {
  constructor() {
    this.observer = null
    this.init()
  }

  init() {
    this.createObserver()
    this.observeElements()
    document.addEventListener("content:rendered", () => this.observeElements())
  }

  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          this.observer.unobserve(entry.target)
        }
      })
    }, CONFIG.animations.observerOptions)
  }

  observeElements() {
    const els = document.querySelectorAll(".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)")
    els.forEach((element) => {
      this.observer.observe(element)
    })
  }
}

// ===== TOAST NOTIFICATIONS =====
class Toast {
  constructor() {
    this.el = document.getElementById("toast")
    this.timer = null
  }

  show(message) {
    if (!this.el) return
    this.el.hidden = false
    this.el.innerHTML = `
      <svg class="toast-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${message}</span>
    `
    requestAnimationFrame(() => this.el.classList.add("is-visible"))
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.hide(), 2400)
  }

  hide() {
    if (!this.el) return
    this.el.classList.remove("is-visible")
    setTimeout(() => { this.el.hidden = true }, 360)
  }
}

// ===== PROJECT FILTER & SEARCH =====
class ProjectFilter {
  constructor(projectManager) {
    this.pm = projectManager
    this.bar = document.getElementById("project-filter-bar")
    this.search = document.getElementById("project-search")
    this.chipsContainer = document.getElementById("project-filter-chips")
    this.grid = document.getElementById("projects-grid")
    this.repos = []
    this.activeLang = "all"
    this.query = ""

    this.init()
  }

  setRepos(repos) {
    this.repos = repos
    if (this.bar) this.bar.hidden = false
    this.buildChips()
  }

  buildChips() {
    if (!this.chipsContainer) return
    const langs = [...new Set(this.repos.map(r => r.language).filter(Boolean))].sort()
    const chips = ["all", ...langs]
    this.chipsContainer.innerHTML = chips.map(lang => `
      <button class="filter-chip ${lang === this.activeLang ? "is-active" : ""}" data-lang="${lang}">${lang}</button>
    `).join("")

    this.chipsContainer.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        this.activeLang = chip.dataset.lang
        this.chipsContainer.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("is-active"))
        chip.classList.add("is-active")
        this.apply()
      })
    })
  }

  init() {
    if (!this.search) return
    this.search.addEventListener("input", Utils.debounce(() => {
      this.query = this.search.value.toLowerCase().trim()
      this.apply()
    }, 200))
  }

  apply() {
    if (!this.grid) return
    const cards = this.grid.querySelectorAll(".project-card")
    let visibleCount = 0

    cards.forEach((card, i) => {
      const repo = this.repos[i]
      if (!repo) return

      const matchesLang = this.activeLang === "all" || repo.language === this.activeLang
      const name = (repo.name || "").toLowerCase()
      const desc = (repo.description || "").toLowerCase()
      const topics = (repo.topics || []).join(" ").toLowerCase()
      const matchesQuery = !this.query || name.includes(this.query) || desc.includes(this.query) || topics.includes(this.query)

      if (matchesLang && matchesQuery) {
        card.classList.remove("is-hidden")
        visibleCount++
      } else {
        card.classList.add("is-hidden")
      }
    })

    this.toggleEmpty(visibleCount === 0)
  }

  toggleEmpty(show) {
    const existing = this.grid.querySelector(".project-empty-state")
    if (show && !existing) {
      this.grid.insertAdjacentHTML("beforeend", `
        <div class="project-empty-state">No projects match your search. Try a different filter.</div>
      `)
    } else if (!show && existing) {
      existing.remove()
    }
  }
}

// ===== README VIEWER MODAL =====
class ReadmeViewer {
  constructor(githubAPI) {
    this.githubAPI = githubAPI
    this.el = document.getElementById("readme-viewer")
    this.titleEl = document.getElementById("readme-viewer-title")
    this.contentEl = document.getElementById("readme-viewer-content")
    this.isOpen = false
    this.init()
  }

  init() {
    this.el?.querySelectorAll("[data-rv-close]").forEach(el => {
      el.addEventListener("click", () => this.close())
    })
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close()
    })
  }

  async open(repoName, displayName) {
    if (!this.el) return
    this.el.hidden = false
    this.isOpen = true
    if (this.titleEl) this.titleEl.textContent = displayName || repoName
    if (this.contentEl) {
      this.contentEl.innerHTML = `
        <div class="readme-viewer-skeleton">
          <div class="skeleton skeleton-line" style="width:60%; height:24px;"></div>
          <div class="skeleton skeleton-line" style="width:90%;"></div>
          <div class="skeleton skeleton-line" style="width:80%;"></div>
          <div class="skeleton skeleton-line" style="width:70%;"></div>
          <div class="skeleton skeleton-line" style="width:50%;"></div>
        </div>
      `
    }
    document.body.style.overflow = "hidden"

    const html = await this.githubAPI.getReadme(repoName)
    if (this.contentEl) {
      if (html) {
        this.contentEl.innerHTML = html
      } else {
        this.contentEl.innerHTML = `
          <p style="color: var(--color-text-muted); text-align: center; padding: var(--space-8) 0;">
            No README found for this repository.
            <br>
            <a href="https://github.com/${CONFIG.github.username}/${repoName}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); font-weight: var(--fw-semibold);">View on GitHub →</a>
          </p>
        `
      }
    }
  }

  close() {
    if (!this.el) return
    this.el.hidden = true
    this.isOpen = false
    document.body.style.overflow = ""
    if (this.contentEl) this.contentEl.innerHTML = ""
  }
}

// ===== UTILITY FUNCTIONS =====
const Utils = {
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  },

  handleExternalLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]')
    externalLinks.forEach((link) => {
      if (!link.hasAttribute("target")) {
        link.setAttribute("target", "_blank")
        link.setAttribute("rel", "noopener noreferrer")
      }
    })
  },

  setFooterYear() {
    const el = document.getElementById("footer-year")
    if (el) el.textContent = new Date().getFullYear()
  },
}

// ===== INITIALIZATION =====
class App {
  constructor() {
    this.themeManager = null
    this.navigationManager = null
    this.projectManager = null
    this.animationManager = null
    this.toast = null
    this.activityFeedManager = null
    this.projectFilter = null
    this.readmeViewer = null
    this.githubAPI = null
  }

  async init() {
    try {
      this.themeManager = new ThemeManager()
      this.navigationManager = new NavigationManager()

      this.toast = new Toast()
      this.githubAPI = new GitHubAPI()
      this.readmeViewer = new ReadmeViewer(this.githubAPI)
      this.projectFilter = new ProjectFilter()
      this.activityFeedManager = new ActivityFeedManager(this.githubAPI)

      this.projectManager = new ProjectManager({
        githubAPI: this.githubAPI,
        readmeViewer: this.readmeViewer,
        projectFilter: this.projectFilter,
      })

      if (!Utils.prefersReducedMotion()) {
        this.animationManager = new AnimationManager()
      }

      this.bindCopyEmail()
      Utils.handleExternalLinks()
      Utils.setFooterYear()

      console.log("Portfolio site initialized successfully")
    } catch (error) {
      console.error("Error initializing portfolio site:", error)
    }
  }

  bindCopyEmail() {
    const btn = document.getElementById("copy-email")
    if (!btn || !this.toast) return
    btn.addEventListener("click", () => {
      const email = "kenmwendwamuthengi@gmail.com"
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
          this.toast.show("Email copied to clipboard")
        }).catch(() => {
          this.toast.show("Email: " + email)
        })
      } else {
        this.toast.show("Email: " + email)
      }
    })
  }
}

// ===== DOM CONTENT LOADED =====
document.addEventListener("DOMContentLoaded", () => {
  const app = new App()
  app.init()
})

// ===== ERROR HANDLING =====
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error)
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
})
