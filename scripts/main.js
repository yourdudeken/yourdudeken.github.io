/**
 * Personal Portfolio Site - Main JavaScript
 * Handles theme switching, smooth scrolling, GitHub API integration, animations,
 * scroll progress, hero typewriter, and live stats.
 */

// ===== CONFIGURATION =====
const CONFIG = {
  github: {
    username: "yourdudeken",
    apiUrl: "https://api.github.com",
    cacheTTL: 10 * 60 * 1000, // 10 minutes
  },
  hero: {
    roles: [
      "web platforms",
      "fintech tools",
      "trading systems",
      "developer APIs",
      "scalable backends",
    ],
    typeSpeed: 85,
    deleteSpeed: 40,
    pause: 1600,
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
      const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
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

// ===== SMOOTH SCROLLING & NAVIGATION =====
class NavigationManager {
  constructor() {
    this.navLinks = document.querySelectorAll(".nav-link")
    this.sections = document.querySelectorAll("section[id]")
    this.nav = document.querySelector(".nav")
    this.scrollProgress = document.getElementById("scroll-progress")

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
      })
    })

    window.addEventListener("scroll", () => this.handleScroll(), { passive: true })
  }

  handleScroll() {
    const scrollY = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight

    if (this.scrollProgress && docHeight > 0) {
      const pct = Math.min(100, (scrollY / docHeight) * 100)
      this.scrollProgress.style.width = `${pct}%`
    }

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

// ===== HERO TYPEWRITER ROTATOR =====
class HeroRotator {
  constructor() {
    this.el = document.getElementById("rotator-word")
    this.roles = CONFIG.hero.roles
    this.typeSpeed = CONFIG.hero.typeSpeed
    this.deleteSpeed = CONFIG.hero.deleteSpeed
    this.pause = CONFIG.hero.pause
    this.roleIndex = 0
    this.charIndex = 0
    this.deleting = false

    if (this.el && !Utils.prefersReducedMotion()) {
      this.tick()
    }
  }

  tick() {
    const current = this.roles[this.roleIndex]

    if (this.deleting) {
      this.charIndex--
    } else {
      this.charIndex++
    }

    this.el.textContent = current.substring(0, this.charIndex)

    let delay = this.deleting ? this.deleteSpeed : this.typeSpeed

    if (!this.deleting && this.charIndex === current.length) {
      delay = this.pause
      this.deleting = true
    } else if (this.deleting && this.charIndex === 0) {
      this.deleting = false
      this.roleIndex = (this.roleIndex + 1) % this.roles.length
      delay = 400
    }

    setTimeout(() => this.tick(), delay)
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

  // localStorage-backed cache with TTL
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

  async getFeaturedRepository() {
    if (this.rateLimitExceeded) {
      return null
    }

    const repos = await this.getRepositories()
    if (!repos || repos.length === 0) {
      return null
    }

    return repos[0]
  }

  // Fetch recent public events for the contribution heatmap
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

    return allEvents.filter(e =>
      e.type === "PushEvent" ||
      e.type === "CreateEvent" ||
      e.type === "PullRequestEvent" ||
      e.type === "IssuesEvent" ||
      e.type === "ReleaseEvent"
    )
  }

  // Fetch and render a repo README as HTML
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
}

// ===== STATS MANAGER (live from GitHub) =====
class StatsManager {
  constructor(githubAPI) {
    this.githubAPI = githubAPI
    this.statEls = {
      repos: document.querySelector('[data-stat="repos"]'),
      stars: document.querySelector('[data-stat="stars"]'),
      languages: document.querySelector('[data-stat="languages"]'),
    }
  }

  async update() {
    if (!this.statEls.repos) return
    const repos = await this.githubAPI.getRepositories()
    if (!repos || repos.length === 0) return

    const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
    const languages = new Set(repos.map(r => r.language).filter(Boolean))

    this.animateNumber(this.statEls.repos, repos.length)
    this.animateNumber(this.statEls.stars, stars)
    this.animateNumber(this.statEls.languages, languages.size)
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
    this.featuredRepoContent = document.getElementById("featured-repo-content")
    this.statsManager = new StatsManager(this.githubAPI)
    this.repos = []

    this.init()
  }

  async init() {
    await this.loadFeaturedRepository()
    await this.loadProjects()
    this.statsManager.update()
  }

  clearSkeletons(container) {
    container?.querySelectorAll(".skeleton-card").forEach(el => el.remove())
  }

  async loadFeaturedRepository() {
    if (!this.featuredRepoContent) return

    try {
      const repo = await this.githubAPI.getFeaturedRepository()
      if (repo) {
        this.renderFeaturedRepository(repo)
      } else {
        this.renderFeaturedRepositoryFallback()
      }
    } catch (error) {
      console.error("Error loading featured repository:", error)
      this.renderFeaturedRepositoryFallback()
    }
  }

  renderFeaturedRepository(repo) {
    const name = this.githubAPI.stripEmojis(repo.name)
    const description = this.githubAPI.stripEmojis(repo.description || "No description available.")
    const updatedDate = repo.updated_at ? this.githubAPI.formatDate(repo.updated_at) : "Recently"

    this.clearSkeletons(this.featuredRepoContent)

    this.featuredRepoContent.innerHTML = `
      <div class="repo-card">
        <h3>${name}</h3>
        <p>${description}</p>
        ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ""}
        <div class="repo-stats">
          <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star" style="vertical-align: text-bottom; margin-right: 4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ${repo.stargazers_count || 0}</span>
          <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-git-branch" style="vertical-align: text-bottom; margin-right: 4px;"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg> ${repo.forks_count || 0}</span>
          <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar" style="vertical-align: text-bottom; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Updated ${updatedDate}</span>
        </div>
        <div class="project-actions">
          <a href="${repo.html_url}" class="btn btn-small btn-primary" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
          ${repo.homepage
        ? `
            <a href="${repo.homepage}" class="btn btn-small btn-secondary" target="_blank" rel="noopener noreferrer">
              Live Demo
            </a>
          `
        : ""
      }
        </div>
      </div>
    `
    document.dispatchEvent(new CustomEvent("content:rendered"))
  }

  renderFeaturedRepositoryFallback() {
    this.clearSkeletons(this.featuredRepoContent)
    this.featuredRepoContent.innerHTML = `
      <div class="repo-card">
        <h3>Featured Project</h3>
        <p>Check out my latest work on GitHub!</p>
        <div class="project-actions">
          <a href="https://github.com/${CONFIG.github.username}" class="btn btn-small btn-primary" target="_blank" rel="noopener noreferrer">
            View GitHub Profile
          </a>
        </div>
      </div>
    `
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
    this.projectsGrid.innerHTML = repos.map((repo, i) => this.createProjectCard(repo, i)).join("")
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

// ===== BLOG MANAGER (Technical Notes — GitHub Repos) =====
class BlogManager {
  constructor(opts = {}) {
    this.blogGrid = document.getElementById("blog-grid")
    this.githubAPI = opts.githubAPI || new GitHubAPI()
    this.readmeViewer = opts.readmeViewer || null

    this.init()
  }

  async init() {
    if (!this.blogGrid) return
    await this.loadTechNotes()
  }

  async loadTechNotes() {
    try {
      this.clearSkeletons(this.blogGrid)

      const repos = await this.githubAPI.getRepositories()

      if (!repos || repos.length === 0) {
        this.renderFallback("No public repositories found. Check back soon!")
        return
      }

      const selected = this.pickRandom(repos, 3)
      selected.forEach(repo => {
        this.blogGrid.insertAdjacentHTML('beforeend', this.createRepoCard(repo))
      })
      this.bindReadmeButtons()
      document.dispatchEvent(new CustomEvent("content:rendered"))
    } catch (error) {
      console.error("Error loading tech notes from GitHub:", error)
      this.renderFallback("Unable to load technical notes at this time.")
    }
  }

  bindReadmeButtons() {
    if (!this.readmeViewer || !this.blogGrid) return
    this.blogGrid.querySelectorAll("[data-readme]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const repoName = btn.dataset.readme
        const displayName = btn.dataset.displayName || repoName
        this.readmeViewer.open(repoName, displayName)
      })
    })
  }

  clearSkeletons(container) {
    container?.querySelectorAll(".skeleton-card").forEach(el => el.remove())
  }

  pickRandom(arr, n) {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]]
    }
    return copy.slice(0, n)
  }

  renderFallback(message) {
    this.clearSkeletons(this.blogGrid)
    this.blogGrid.insertAdjacentHTML('beforeend', `
      <div class="blog-card blog-card--empty">
        <div class="blog-content">
          <p class="blog-excerpt">${message}</p>
        </div>
      </div>
    `)
  }

  createRepoCard(repo) {
    const name = this.githubAPI.stripEmojis(repo.name).replace(/-+/g, ' ').trim()
    const description = this.githubAPI.stripEmojis(repo.description || "No description available.")
    const language = repo.language || 'Code'
    const stars = repo.stargazers_count || 0
    const updatedDate = repo.updated_at ? this.githubAPI.formatDate(repo.updated_at) : 'Recently'
    const defaultBranch = repo.default_branch || 'main'
    const readmeUrl = `${repo.html_url}/blob/${defaultBranch}/README.md`

    return `
      <article class="blog-card fade-in-up">
        <div class="blog-card-accent"></div>
        <div class="blog-content">
          <div class="blog-meta">
            <span class="blog-lang-tag">${language}</span>
            <span class="blog-stars">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ${stars}
            </span>
          </div>
          <h3 class="blog-title">${name}</h3>
          <p class="blog-excerpt">${description}</p>
          <div class="blog-footer">
            <span class="blog-updated">Updated ${updatedDate}</span>
            <a href="#" class="blog-link" data-readme="${repo.name}" data-display-name="${name}">
              Read README
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      </article>
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

// ===== COMMAND PALETTE (Cmd/Ctrl+K) =====
class CommandPalette {
  constructor(toast) {
    this.toast = toast
    this.el = document.getElementById("command-palette")
    this.input = document.getElementById("command-palette-input")
    this.list = document.getElementById("command-palette-list")
    this.commands = []
    this.filtered = []
    this.activeIndex = 0
    this.isOpen = false

    this.init()
  }

  init() {
    this.buildCommands()
    this.bindEvents()
  }

  buildCommands() {
    const sections = [
      { label: "Home", href: "#hero", icon: this.iconHome() },
      { label: "About", href: "#about", icon: this.iconUser() },
      { label: "Selected Work", href: "#work", icon: this.iconBriefcase() },
      { label: "Featured Repository", href: "#featured-repo", icon: this.iconStar() },
      { label: "Open Source", href: "#projects", icon: this.iconCode() },
      { label: "Activity", href: "#activity", icon: this.iconActivity() },
      { label: "Technical Notes", href: "#blog", icon: this.iconBook() },
      { label: "Contact", href: "#contact", icon: this.iconMail() },
    ]

    const links = [
      { label: "GitHub Profile", href: "https://github.com/yourdudeken", icon: this.iconGithub(), external: true },
      { label: "LinkedIn", href: "https://linkedin.com/in/yourdudeken", icon: this.iconLinkedin(), external: true },
      { label: "Twitter", href: "https://twitter.com/yourdudeken", icon: this.iconTwitter(), external: true },
      { label: "EventTik", href: "https://eventtik.co.ke", icon: this.iconExternal(), external: true },
      { label: "Copy Email", action: "copy-email", icon: this.iconCopy() },
    ]

    this.commands = [...sections, ...links]
  }

  iconHome() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' }
  iconUser() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' }
  iconBriefcase() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>' }
  iconStar() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' }
  iconCode() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>' }
  iconActivity() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' }
  iconBook() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' }
  iconMail() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' }
  iconGithub() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>' }
  iconLinkedin() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>' }
  iconTwitter() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>' }
  iconExternal() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' }
  iconCopy() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' }
  iconSearch() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' }

  bindEvents() {
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        this.isOpen ? this.close() : this.open()
      }
      if (e.key === "Escape" && this.isOpen) this.close()
    })

    this.el?.querySelectorAll("[data-cp-close]").forEach(el => {
      el.addEventListener("click", () => this.close())
    })

    this.input?.addEventListener("input", () => {
      this.filter(this.input.value)
    })

    this.input?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        this.activeIndex = Math.min(this.activeIndex + 1, this.filtered.length - 1)
        this.render()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        this.activeIndex = Math.max(this.activeIndex - 1, 0)
        this.render()
      } else if (e.key === "Enter") {
        e.preventDefault()
        this.execute(this.filtered[this.activeIndex])
      }
    })
  }

  open() {
    if (!this.el) return
    this.el.hidden = false
    this.isOpen = true
    this.input.value = ""
    this.filter("")
    setTimeout(() => this.input?.focus(), 50)
    document.body.style.overflow = "hidden"
  }

  close() {
    if (!this.el) return
    this.el.hidden = true
    this.isOpen = false
    document.body.style.overflow = ""
  }

  filter(query) {
    const q = query.toLowerCase().trim()
    if (!q) {
      this.filtered = [...this.commands]
    } else {
      this.filtered = this.commands.filter(c => c.label.toLowerCase().includes(q))
    }
    this.activeIndex = 0
    this.render()
  }

  render() {
    if (!this.list) return

    if (this.filtered.length === 0) {
      this.list.innerHTML = `<li class="command-palette-empty">No results found</li>`
      return
    }

    this.list.innerHTML = this.filtered.map((cmd, i) => `
      <li class="command-palette-item ${i === this.activeIndex ? "is-active" : ""}" role="option" data-index="${i}">
        <span class="command-palette-item-icon">${cmd.icon}</span>
        <span class="command-palette-item-label">${cmd.label}</span>
        <span class="command-palette-item-hint">${cmd.external ? "↗" : cmd.action ? "action" : "jump"}</span>
      </li>
    `).join("")

    this.list.querySelectorAll(".command-palette-item").forEach(item => {
      item.addEventListener("click", () => {
        this.filtered[parseInt(item.dataset.index)]
        this.execute(this.filtered[parseInt(item.dataset.index)])
      })
      item.addEventListener("mouseenter", () => {
        this.activeIndex = parseInt(item.dataset.index)
        this.render()
      })
    })
  }

  execute(cmd) {
    if (!cmd) return

    if (cmd.action === "copy-email") {
      this.copyEmail()
      this.close()
      return
    }

    if (cmd.external) {
      window.open(cmd.href, "_blank", "noopener,noreferrer")
      this.close()
      return
    }

    // Section navigation
    const target = document.querySelector(cmd.href)
    if (target) {
      const offsetTop = target.offsetTop - 80
      window.scrollTo({ top: offsetTop, behavior: "smooth" })
    }
    this.close()
  }

  copyEmail() {
    const email = "kenmwendwamuthengi@gmail.com"
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        this.toast?.show("Email copied to clipboard")
      }).catch(() => {
        this.toast?.show("Email: " + email)
      })
    } else {
      this.toast?.show("Email: " + email)
    }
  }
}

// ===== HEATMAP MANAGER (GitHub Activity) =====
class HeatmapManager {
  constructor(githubAPI) {
    this.githubAPI = githubAPI
    this.container = document.getElementById("heatmap-container")
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
      console.error("Error loading heatmap:", error)
      this.renderEmpty()
    }
  }

  buildActivityMap(events) {
    const map = new Map()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = 140 // ~20 weeks
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      map.set(this.dateKey(d), 0)
    }

    events.forEach(event => {
      const d = new Date(event.created_at)
      d.setHours(0, 0, 0, 0)
      const key = this.dateKey(d)
      if (map.has(key)) {
        const increments =
          event.type === "PushEvent" ? (event.payload?.commits?.length || 1) : 1
        map.set(key, map.get(key) + increments)
      }
    })

    return map
  }

  dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  getLevel(count) {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 4) return 2
    if (count <= 6) return 3
    return 4
  }

  render(events) {
    const map = this.buildActivityMap(events)
    const sortedDates = [...map.keys()].sort()
    const totalContribs = [...map.values()].reduce((a, b) => a + b, 0)

    // Align to weekday columns (Sun–Sat)
    const firstDate = new Date(sortedDates[0] + "T00:00:00")
    const startDay = firstDate.getDay()
    for (let i = 0; i < startDay; i++) {
      sortedDates.unshift(null)
    }

    this.container.querySelectorAll(".skeleton-card").forEach(el => el.remove())

    this.container.innerHTML = `
      <div class="heatmap">
        <div class="heatmap-grid">
          ${sortedDates.map(dateStr => {
      if (!dateStr) return `<div class="heatmap-cell" style="visibility:hidden;"></div>`
      const count = map.get(dateStr)
      const level = this.getLevel(count)
      const d = new Date(dateStr + "T00:00:00")
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return `<div class="heatmap-cell" data-level="${level}" title="${label}: ${count} contribution${count !== 1 ? "s" : ""}"></div>`
    }).join("")}
        </div>
        <div class="heatmap-footer">
          <span>${totalContribs} contributions in the last ${map.size} days</span>
          <div class="heatmap-legend">
            <span>Less</span>
            <div class="heatmap-legend-cells">
              <div class="heatmap-cell" data-level="0"></div>
              <div class="heatmap-cell" data-level="1"></div>
              <div class="heatmap-cell" data-level="2"></div>
              <div class="heatmap-cell" data-level="3"></div>
              <div class="heatmap-cell" data-level="4"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    `
    document.dispatchEvent(new CustomEvent("content:rendered"))
  }

  renderEmpty() {
    this.container.querySelectorAll(".skeleton-card").forEach(el => el.remove())
    this.container.innerHTML = `
      <div class="heatmap">
        <p style="text-align:center; color: var(--color-text-muted); padding: var(--space-8) 0;">
          No recent public activity to display. <a href="https://github.com/${CONFIG.github.username}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); font-weight: var(--fw-semibold);">View GitHub profile →</a>
        </p>
      </div>
    `
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
    this.blogManager = null
    this.animationManager = null
    this.heroRotator = null
    this.toast = null
    this.commandPalette = null
    this.heatmapManager = null
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
      this.commandPalette = new CommandPalette(this.toast)
      this.heatmapManager = new HeatmapManager(this.githubAPI)

      this.projectManager = new ProjectManager({
        githubAPI: this.githubAPI,
        readmeViewer: this.readmeViewer,
        projectFilter: this.projectFilter,
      })
      this.blogManager = new BlogManager({
        githubAPI: this.githubAPI,
        readmeViewer: this.readmeViewer,
      })

      if (!Utils.prefersReducedMotion()) {
        this.animationManager = new AnimationManager()
        this.heroRotator = new HeroRotator()
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

// ===== EXPORT FOR TESTING (if needed) =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ThemeManager,
    NavigationManager,
    HeroRotator,
    GitHubAPI,
    StatsManager,
    ProjectManager,
    BlogManager,
    AnimationManager,
    Toast,
    CommandPalette,
    HeatmapManager,
    ProjectFilter,
    ReadmeViewer,
    Utils,
    CONFIG,
  }
}
