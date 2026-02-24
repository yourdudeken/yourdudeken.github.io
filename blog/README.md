# Headless CMS Developer Guide

This blog system is designed to work as a robust headless CMS for your static websites (GitHub Pages, etc.).

## API Endpoints

### 1. Get All Posts
**URL:** `GET /api/posts`
**Query Parameters:**
- `tag`: Filter by a specific tag (e.g., `?tag=tech`)
- `page`: Pagination page (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "posts": [...],
  "totalPages": 5,
  "currentPage": 1,
  "totalPosts": 48
}
```

### 2. Get Single Post (by ID or Slug)
**URL:** `GET /api/posts/:identifier`
- `identifier` can be the MongoDB `_id` or the readable `slug` (e.g., `my-awesome-blog-post`).

## Integration Example (Frontend)

To load your blogs on another website, you can use the `fetch` API:

```javascript
async function loadBlogs() {
    const response = await fetch('YOUR_SERVER_URL/api/posts');
    const data = await response.json();
    
    const container = document.getElementById('blog-list');
    container.innerHTML = data.posts.map(post => `
        <article>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <a href="/post.html?slug=${post.slug}">Read More</a>
        </article>
    `).join('');
}
```

## Features for Developers
- **Automatic Slugs**: Titles are automatically converted to SEO-friendly slugs.
- **Excerpts**: Automatically generated from content if not provided.
- **Tags**: Organize content for specific sections of your site.
- **Status Support**: Hide 'draft' posts from public endpoints (coming soon in filters).
- **CORS Enabled**: Ready to be called from any domain.

## Deployment Note
If hosting on GitHub Pages, ensure your backend is deployed to a platform like Vercel, Heroku, or a VPS with a public URL, and update your frontend `fetch` calls to point to that URL.
