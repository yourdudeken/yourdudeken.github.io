class BlogManager {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        this.isAdminMode = false;

        // Cache DOM elements
        this.postsContainer = document.getElementById('blog-posts-container');
        this.modal = document.getElementById('post-modal');
        this.postForm = document.getElementById('post-form');
        this.newPostBtn = document.getElementById('new-post-btn');
        this.modalTitle = document.getElementById('modal-title');

        // Save original form template to quickly restore it
        this.formTemplate = this.postForm.innerHTML;

        this.init();
    }

    async init() {
        this.detectViewMode();
        await this.loadPosts();
        this.setupEventListeners();

        // Handle browser navigation
        window.onpopstate = () => {
            this.detectViewMode();
        };
    }

    detectViewMode() {
        const path = window.location.pathname;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Mode logic:
        // /blog/ or /blog -> Admin if local
        // /blog/index.html -> User view (no buttons)
        // /blog/slug -> Post view

        const isRawBlogPath = path === '/blog' || path.endsWith('/blog/');
        this.isAdminMode = isLocal && isRawBlogPath;

        const controls = document.querySelector('.blog-controls');
        if (controls) {
            controls.style.display = this.isAdminMode ? 'flex' : 'none';
        }

        // Check if we are viewing a specific post
        const parts = path.split('/').filter(p => p);
        if (parts.length === 2 && parts[0] === 'blog' && parts[1] !== 'index.html') {
            this.showPost(parts[1], false);
        } else {
            this.closeModal();
            this.renderPosts();
        }
    }

    async loadPosts() {
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const url = isLocal ? '/api/posts' : '/blog/posts.json';

            const response = await fetch(url + '?t=' + Date.now());
            this.posts = await response.json();
            this.renderPosts();
        } catch (e) {
            console.error('Error loading posts', e);
            if (this.postsContainer) {
                this.postsContainer.innerHTML = '<div class="loading-spinner">Error loading posts.</div>';
            }
        }
    }

    renderPosts() {
        if (!this.postsContainer) return;

        if (this.posts.length === 0) {
            this.postsContainer.innerHTML = '<div class="loading-spinner">No posts yet.</div>';
            return;
        }

        this.postsContainer.innerHTML = this.posts.map(post => `
            <article class="blog-card" data-id="${post.id}" id="post-${post.id}">
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date">${post.category}</span>
                        <span class="read-time">${post.readTime}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                </div>
                <div class="card-actions">
                    ${this.isAdminMode ? `
                        <button class="btn btn-secondary btn-small btn-edit" title="Edit Post">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-secondary btn-small btn-delete" title="Delete Post">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    ` : ''}
                    <a href="/blog/${post.id}" class="btn btn-primary btn-small btn-read" style="margin-left: auto">Read Article</a>
                </div>
            </article>
        `).join('');

        this.attachCardEventListeners();
    }

    setupEventListeners() {
        this.newPostBtn?.addEventListener('click', () => this.openCreateModal());

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.handleNavigationBack());
        });

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.handleNavigationBack();
        });
    }

    handleNavigationBack() {
        const path = window.location.pathname;
        if (path !== '/blog/' && path !== '/blog' && path !== '/blog/index.html') {
            window.history.pushState({}, '', '/blog/');
            this.detectViewMode();
        } else {
            this.closeModal();
        }
    }

    attachCardEventListeners() {
        this.postsContainer.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.closest('.blog-card').dataset.id;
                this.openEditModal(id);
            });
        });

        this.postsContainer.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.closest('.blog-card').dataset.id;
                if (confirm('Are you sure you want to delete this post?')) {
                    this.deletePost(id);
                }
            });
        });

        this.postsContainer.querySelectorAll('.btn-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.currentTarget.closest('.blog-card').dataset.id;
                this.showPost(id, true);
            });
        });
    }

    async showPost(id, shouldPushState = true) {
        try {
            const response = await fetch(`/blog/posts/${id}.json?t=${Date.now()}`);
            if (!response.ok) throw new Error('Post not found');
            const post = await response.json();

            if (shouldPushState) {
                window.history.pushState({ postId: id }, '', `/blog/${id}`);
            }

            this.modalTitle.innerText = post.title;
            this.postForm.innerHTML = `
                <div class="post-reader">
                    <div class="blog-meta" style="margin-bottom: var(--space-4)">
                        <span>${post.category}</span> • <span>${post.readTime}</span> • <span>${post.date}</span>
                    </div>
                    <div class="post-body">
                        ${post.content ? post.content.replace(/\n/g, '<br>') : 'No content available.'}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary close-btn-nav">Close</button>
                    ${this.isAdminMode ? `<button type="button" class="btn btn-primary btn-edit-trigger">Edit Content</button>` : ''}
                </div>
            `;

            this.postForm.querySelector('.close-btn-nav').onclick = () => this.handleNavigationBack();
            if (this.isAdminMode) {
                this.postForm.querySelector('.btn-edit-trigger').onclick = (e) => {
                    e.preventDefault();
                    this.openEditModal(id);
                };
            }
            this.modal.classList.add('active');
        } catch (e) {
            console.error('Failed to load post', e);
            if (shouldPushState) alert('Failed to load post content.');
        }
    }

    async openEditModal(id) {
        this.currentEditId = id;
        this.postForm.innerHTML = this.formTemplate;
        this.modalTitle.innerText = 'Edit Post';

        try {
            const response = await fetch(`/blog/posts/${id}.json?t=${Date.now()}`);
            const post = await response.json();

            document.getElementById('post-id').value = post.id;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-category').value = post.category;
            document.getElementById('post-read-time').value = post.readTime.split(' ')[0];
            document.getElementById('post-excerpt').value = post.excerpt;
            document.getElementById('post-content').value = post.content || '';
        } catch (e) {
            console.error('Error fetching post for edit', e);
        }

        this.attachFormSubmit();
        this.modal.classList.add('active');
    }

    openCreateModal() {
        this.currentEditId = null;
        this.postForm.innerHTML = this.formTemplate;
        this.modalTitle.innerText = 'New Post';
        this.postForm.reset();
        this.attachFormSubmit();
        this.modal.classList.add('active');
    }

    attachFormSubmit() {
        this.postForm.querySelector('.close-modal').onclick = () => this.closeModal();
        this.postForm.onsubmit = (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        };
    }

    async handleFormSubmit() {
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const readTimeVal = document.getElementById('post-read-time').value;
        const excerpt = document.getElementById('post-excerpt').value;
        const content = document.getElementById('post-content').value;

        const postData = {
            id: this.currentEditId,
            title,
            category,
            readTime: `${readTimeVal} min read`,
            excerpt,
            content,
            date: new Date().toISOString().split('T')[0]
        };

        const method = this.currentEditId ? 'PUT' : 'POST';

        try {
            const response = await fetch('/api/posts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                await this.loadPosts();
                this.closeModal();
            } else {
                alert('Failed to save post.');
            }
        } catch (e) {
            alert('Error connecting to dev server.');
        }
    }

    async deletePost(id) {
        try {
            const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await this.loadPosts();
            } else {
                alert('Failed to delete post.');
            }
        } catch (e) {
            alert('Error connecting to dev server.');
        }
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.currentEditId = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
});
