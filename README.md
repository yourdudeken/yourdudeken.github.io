# Kennedy Muthengi | Full-Stack Developer Portfolio

![Portfolio Screenshot](assets/ken-photo.jpeg)

A premium, responsive, static developer portfolio built with vanilla HTML, CSS, and JavaScript. Deployed on GitHub Pages — no backend, no build step, no dependencies.

**[Live Site](https://yourdudeken.github.io)**

---

## Technical Highlights

- **Premium UI/UX**: Minimal, high-contrast design system using Indigo, Sky, and Emerald palettes. Glassmorphism where appropriate, smooth micro-animations, and reduced-motion support.
- **Floating Navigation**: A responsive pill navigation with active-section tracking and scroll-aware styling.
- **Command Palette (Cmd/Ctrl+K)**: Full keyboard-navigable palette for jumping to sections, opening external links, and copying contact info.
- **GitHub Integration**:
    - Live repository fetching via GitHub public API with localStorage caching (10-minute TTL).
    - Graceful fallbacks when API rate limits are hit.
    - In-page README viewer modal (renders Markdown via `marked`).
    - Contribution activity heatmap from public events.
- **Real Project Showcase**: Hand-curated flagship projects (EventTik, driveos, capturenest) with verified descriptions, tech stacks, and live links — plus an automatically populated open-source grid.
- **SEO & Performance**: Descriptive meta tags, Open Graph, Twitter cards, JSON-LD structured data, sitemap, robots.txt, web manifest, canonical URL, and minimal external dependencies.
- **Accessibility**: Skip link, semantic HTML5, ARIA roles, focus-visible states, keyboard navigation, and `prefers-reduced-motion` handling.

---

## Getting Started

### Prerequisites

Zero dependencies. Only a modern browser and a text editor are needed.

### Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourdudeken/yourdudeken.github.io.git
   ```

2. **Configure your identity**:
   Update your details in `index.html` (name, bio, projects) and `scripts/main.js`.

3. **Set your GitHub profile**:
   In `scripts/main.js`, update the username in the configuration object:
   ```javascript
   const CONFIG = {
     github: {
       username: "yourdudeken"
     }
   }
   ```

4. **Deployment**:
   Push to the `main` branch. A GitHub Action deploys to the `gh-pages` branch automatically.

---

## GitHub Pages Setup

1. Go to your repo **Settings** > **Pages**.
2. Under **Build and deployment** > **Branch**, select `gh-pages` and `/ (root)`.
3. Save.

---

## Architecture and File Structure

```
yourdudeken.github.io/
├── index.html              # Core structure and SEO metadata
├── styles/
│   └── main.css            # Custom CSS3 theme with design tokens
├── scripts/
│   └── main.js             # JavaScript engine (GitHub API, UI, animations)
├── assets/
│   ├── ken-photo.jpeg      # Profile photo
│   ├── ken-photo-circle.png# Favicon / icon
│   └── eventtik.png        # EventTik project screenshot
├── robots.txt              # Crawler directives
├── sitemap.xml             # Sitemap for search engines
├── site.webmanifest        # PWA manifest
└── README.md               # Documentation
```

---

## Technical Stack

- **HTML5**: Semantic document structure.
- **CSS3**: Grid/Flexbox layouts, custom properties (design tokens), dark/light themes.
- **Vanilla JavaScript**: Modular ES6 classes, IntersectionObserver animations, GitHub API integration.

---

## Contact

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yourdudeken/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourdudeken)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/yourdudeken)
