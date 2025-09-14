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
      this.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙"
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

    const url = `${this.baseUrl}/users/${this.username}/repos?sort=updated&per_page=6`
    const repos = await this.fetchWithCache(url, "repositories")

    return repos || CONFIG.github.fallbackProjects
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
    const updatedDate = repo.updated_at ? this.githubAPI.formatDate(repo.updated_at) : "Recently"

    this.featuredRepoContent.innerHTML = `
      <div class="repo-card">
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description available."}</p>
        ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ""}
        <div class="repo-stats">
          <span>⭐ ${repo.stargazers_count || 0}</span>
          <span>🍴 ${repo.forks_count || 0}</span>
          <span>📅 Updated ${updatedDate}</span>
        </div>
        <div class="project-actions">
          <a href="${repo.html_url}" class="btn btn-small btn-primary" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
          ${
            repo.homepage
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
        this.renderProjects(repos.slice(0, 6)) // Show up to 6 projects
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
    const primaryTopics = topics.slice(0, 3) // Show up to 3 topics

    return `
      <div class="project-card fade-in-up">
        <img src="/assets/placeholder-project.jpg" alt="${repo.name} screenshot" class="project-image" loading="lazy">
        <div class="project-content">
          <h3 class="project-title">${repo.name}</h3>
          <p class="project-description">${repo.description || "No description available."}</p>
          <div class="project-tech">
            ${repo.language ? `<span class="tech-tag">${repo.language}</span>` : ""}
            ${primaryTopics.map((topic) => `<span class="tech-tag">${topic}</span>`).join("")}
          </div>
          <div class="project-actions">
            <a href="${repo.html_url}" class="btn btn-small" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
            ${
              repo.homepage
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
