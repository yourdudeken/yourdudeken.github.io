/**
 * Personal Portfolio Site - Main JavaScript
 * Handles theme switching, smooth scrolling, GitHub API integration, and animations
 */

// ===== CONFIGURATION =====
const CONFIG = {
  github: {
    username: "yourdudeken",
    apiUrl: "https://api.github.com",
    // Fallback projects data for when API is unavailable
    fallbackProjects: [
      {
        id: 1,
        name: "awesome-web-app",
        description: "A modern web application built with vanilla JavaScript and responsive design principles.",
        html_url: "https://github.com/yourdudeken/awesome-web-app",
        homepage: "https://yourdudeken.github.io/awesome-web-app",
        language: "JavaScript",
        topics: ["javascript", "html", "css", "responsive-design"],
      },
      {
        id: 2,
        name: "python-data-analyzer",
        description: "Data analysis tool for processing and visualizing large datasets with Python and pandas.",
        html_url: "https://github.com/yourdudeken/python-data-analyzer",
        homepage: null,
        language: "Python",
        topics: ["python", "data-analysis", "pandas", "visualization"],
      },
      {
        id: 3,
        name: "react-component-library",
        description: "Reusable React components with TypeScript and comprehensive testing suite.",
        html_url: "https://github.com/yourdudeken/react-component-library",
        homepage: "https://yourdudeken.github.io/react-component-library",
        language: "TypeScript",
        topics: ["react", "typescript", "components", "testing"],
      },
    ],
  },
  animations: {
    observerOptions: {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
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

    // Listen for system theme changes
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

    this.init()
  }

  init() {
    this.bindEvents()
    this.handleScroll()
  }

  bindEvents() {
    // Smooth scrolling for navigation links
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetId = link.getAttribute("href")
        const targetSection = document.querySelector(targetId)

        if (targetSection) {
          const offsetTop = targetSection.offsetTop - 80 // Account for fixed nav
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          })
        }
      })
    })

    // Handle scroll events for nav styling and active states
    window.addEventListener("scroll", () => this.handleScroll())
  }

  handleScroll() {
    const scrollY = window.scrollY

    // Add/remove nav background based on scroll position
    if (scrollY > 50) {
      this.nav?.classList.add("scrolled")
    } else {
      this.nav?.classList.remove("scrolled")
    }

    // Update active navigation link
    this.updateActiveNavLink()
  }

  updateActiveNavLink() {
    const scrollY = window.scrollY + 100

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
  }

  async fetchWithCache(url, cacheKey) {
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(url)

      // Check rate limit
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
      return data
    } catch (error) {
      console.error("GitHub API fetch error:", error)
      return null
    }
  }

  async getRepositories() {
    if (this.rateLimitExceeded) {
      return CONFIG.github.fallbackProjects
    }

    const url = `${this.baseUrl}/users/${this.username}/repos?sort=updated&per_page=100`
    const repos = await this.fetchWithCache(url, "repositories")

    if (!repos) return CONFIG.github.fallbackProjects

    // Filter out forked repositories
    return repos.filter(repo => !repo.fork) || CONFIG.github.fallbackProjects
  }

  async getFeaturedRepository() {
    if (this.rateLimitExceeded) {
      return CONFIG.github.fallbackProjects[0]
    }

    const repos = await this.getRepositories()
    if (!repos || repos.length === 0) {
      return CONFIG.github.fallbackProjects[0]
    }

    // Get the most recently updated repository
    return repos[0]
  }

  stripEmojis(text) {
    if (!text) return ""
    // Regex to match emojis and some other special characters that render as emojis
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

// ===== PROJECT DISPLAY MANAGER =====
class ProjectManager {
  constructor() {
    this.githubAPI = new GitHubAPI()
    this.projectsGrid = document.getElementById("projects-grid")
    this.featuredRepoContent = document.getElementById("featured-repo-content")

    this.init()
  }

  async init() {
    await this.loadFeaturedRepository()
    await this.loadProjects()
  }

  async loadFeaturedRepository() {
    if (!this.featuredRepoContent) return

    try {
      const repo = await this.githubAPI.getFeaturedRepository()
      if (repo) {
        this.renderFeaturedRepository(repo)
      }
    } catch (error) {
      console.error("Error loading featured repository:", error)
      this.renderFeaturedRepositoryFallback()
    }
  }

  renderFeaturedRepository(repo) {
    const name = this.githubAPI.stripEmojis(repo.name)
    const description = this.githubAPI.stripEmojis(repo.description || "No description available.")

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
  }

  renderFeaturedRepositoryFallback() {
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
        this.renderProjects(repos) // Show all projects
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      this.renderProjectsFallback()
    }
  }

  renderProjects(repos) {
    this.projectsGrid.innerHTML = repos.map((repo) => this.createProjectCard(repo)).join("")
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
      </div>
    `
  }

  renderProjectsFallback() {
    this.projectsGrid.innerHTML = CONFIG.github.fallbackProjects.map((repo) => this.createProjectCard(repo)).join("")
  }
}

// ===== ANIMATION MANAGER =====
class AnimationManager {
  constructor() {
    this.observedElements = document.querySelectorAll("section, .project-card, .featured-repo-card")
    this.observer = null

    this.init()
  }

  init() {
    this.createObserver()
    this.observeElements()
  }

  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in-up")
          this.observer.unobserve(entry.target)
        }
      })
    }, CONFIG.animations.observerOptions)
  }

  observeElements() {
    this.observedElements.forEach((element) => {
      this.observer.observe(element)
    })
  }
}

// ===== UTILITY FUNCTIONS =====
const Utils = {
  // Debounce function for performance optimization
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

  // Check if user prefers reduced motion
  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  },

  // Handle external links
  handleExternalLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]')
    externalLinks.forEach((link) => {
      if (!link.hasAttribute("target")) {
        link.setAttribute("target", "_blank")
        link.setAttribute("rel", "noopener noreferrer")
      }
    })
  },
}

// ===== INITIALIZATION =====
class App {
  constructor() {
    this.themeManager = null
    this.navigationManager = null
    this.projectManager = null
    this.animationManager = null
  }

  async init() {
    try {
      // Initialize core functionality
      this.themeManager = new ThemeManager()
      this.navigationManager = new NavigationManager()

      // Initialize GitHub integration and projects
      this.projectManager = new ProjectManager()

      // Initialize animations (only if user doesn't prefer reduced motion)
      if (!Utils.prefersReducedMotion()) {
        this.animationManager = new AnimationManager()
      }

      // Handle external links
      Utils.handleExternalLinks()

      console.log("Portfolio site initialized successfully")
    } catch (error) {
      console.error("Error initializing portfolio site:", error)
    }
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
    GitHubAPI,
    ProjectManager,
    AnimationManager,
    Utils,
    CONFIG,
  }
}
