# Ken | Full-Stack Developer Portfolio

![Portfolio Screenshot](assets/ken-photo.jpeg)

A premium, responsive, and highly customizable personal portfolio website. Built with precision using vanilla HTML, CSS, and JavaScript, this project showcases a modern aesthetic with advanced dynamic integrations.

**[Live Demo](https://yourdudeken.github.io)**

---

## Technical Highlights

- **Premium UI/UX**: Features a vibrant design system using Indigo, Sky, and Violet palettes. Includes advanced glassmorphism effects, smooth micro-animations, and custom-tuned transitions.
- **Floating Navigation**: A custom-engineered floating pill navigation system that remains responsive across all screen sizes.
- **Intelligent GitHub Integration**: 
    - Real-time fetching of repository data via GitHub API.
    - Automatic filtering to exclude forks/clones and specific meta-repositories.
    - Smart sorting by latest pushed activity to prioritize current work.
    - Automated emoji stripping for a clean, professional text-only interface.
- **SEO & Performance**: Optimized with descriptive meta tags, semantic HTML5 structure, and minimal external dependencies for lightning-fast load times.
- **Technical Notes**: A curated section highlighting deep technical expertise in Networking, Backend Service Architecture, and System Design.

---

## Getting Started

### Prerequisites

This project is built with zero dependencies. You only need a modern web browser and a text editor.

### Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourdudeken/yourdudeken.github.io.git
   ```

2. **Configure your identity**:
   Update your details in `index.html` including name, bio, and technical expertise.

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
   Push your changes to the `main` branch. GitHub Pages will automatically deploy your site from the repository root.

---

## Architecture and File Structure

```
yourdudeken.github.io/
├── index.html              # Core structure and SEO metadata
├── styles/
│   └── main.css            # Custom CSS3 theme with glassmorphism logic
├── scripts/
│   └── main.js             # JavaScript Engine (GitHub API, UI logic, animations)
├── assets/
│   └── ken-photo.jpeg      # Profile assets
└── README.md               # Documentation
```

---

## Technical Stack

- **HTML5**: Semantic document structure.
- **CSS3**: Advanced layouts (Grid/Flexbox) and theme variables.
- **Vanilla JavaScript**: Dynamic project rendering and intersection observers for animations.

---

## Contact and Interaction

I am always open to discussing new technical challenges and collaborative opportunities.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kennedy-wanjau/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourdudeken)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/yourdudeken)

---

## Statistics

![Profile Views](https://komarev.com/ghpvc/?username=yourdudeken&style=flat-square&color=blue)
