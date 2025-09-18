# Personal Portfolio Website

![Portfolio Screenshot](assets/ken-photo.jpeg)

A clean, responsive, and customizable personal portfolio website built with vanilla HTML, CSS, and JavaScript. It features a light/dark theme toggle and fetches repository data from the GitHub API.

**[Live Demo](https://yourdudeken.github.io)**

---

## Features

- **Responsive Design**: Looks great on all devices, from mobile to desktop.
- **Light/Dark Theme**: Switch between light and dark modes.
- **GitHub API Integration**: Automatically fetches and displays your GitHub repositories.
- **SEO Optimized**: Basic SEO enhancements for better search engine visibility.
- **Accessibility**: Built with accessibility in mind.

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You don't need any special tools. A modern web browser and a code editor are all you need.

### Installation & Setup

1.  **Fork the repository** or create a new repository named `your-username.github.io`.
2.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourdudeken/yourdudeken.github.io.git
    ```
3.  **Navigate to the project directory**:
    ```bash
    cd yourdudeken.github.io
    ```
4.  **Customize the content**:
    -   **Update personal info in `index.html`**: Change the name, tagline, bio, skills, and contact links.
    -   **Update GitHub username in `scripts/main.js`**:
        ```javascript
        const CONFIG = {
          github: {
            username: "yourdudeken" // Replace with your GitHub username
          }
        }
        ```
    -   **Replace images in the `assets/` folder**:
        -   `ken-photo.jpeg`: Your profile picture.
5.  **Deploy to GitHub Pages**:
    -   Push your changes to the `main` branch.
    -   Go to your repository's settings.
    -   Under the "Pages" section, select the `main` branch as the source.
    -   Your portfolio will be live at `https://your-username.github.io`.

---

## File Structure

```
yourdudeken.github.io/
├── index.html              # Main HTML file
├── styles/
│   └── main.css            # Main stylesheet
├── scripts/
│   └── main.js             # Main JavaScript file
├── assets/
│   └── ken-photo.jpeg      # Profile picture
└── README.md               # This file
```

---

## Built With

-   **HTML5**
-   **CSS3**
-   **Vanilla JavaScript**

---

## Connect with me

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kennedy-wanjau/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourdudeken)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/yourdudeken)

---

## Profile Views

![Profile Views](https://komarev.com/ghpvc/?username=yourdudeken&style=flat-square&color=blue)
