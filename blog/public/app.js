document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const postModal = document.getElementById('post-modal');
    const postForm = document.getElementById('post-form');
    const modalTitle = document.getElementById('modal-title');
    const openCreateModalBtn = document.getElementById('open-create-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

    let isEditing = false;
    const API_URL = '/api/posts';

    // Fetch and display posts
    async function fetchPosts() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            // Data now contains { posts: [], totalPages, currentPage, totalPosts }
            displayPosts(data.posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            postsContainer.innerHTML = `<p class="error">Failed to load posts. Is the server running?</p>`;
        }
    }

    function displayPosts(posts) {
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p>No posts found. Start by creating one!</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = posts.map(post => `
            <div class="post-card" data-id="${post._id}">
                <div class="post-meta">
                    <span><i class="fas fa-user"></i> ${post.author}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3>${post.title}</h3>
                <div class="post-tags">
                    ${(post.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
                <div class="post-content">${post.excerpt || (post.content.substring(0, 150) + '...')}</div>
                <div class="post-actions">
                    <button class="btn btn-secondary edit-btn" onclick="editPost('${post._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger delete-btn" onclick="deletePost('${post._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn btn-secondary api-btn" onclick="copyApiUrl('${post.slug}')">
                        <i class="fas fa-link"></i> API
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Modal Handle
    openCreateModalBtn.addEventListener('click', () => {
        isEditing = false;
        modalTitle.textContent = 'Create New Post';
        postForm.reset();
        document.getElementById('post-id').value = '';
        postModal.style.display = 'flex';
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            postModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === postModal) {
            postModal.style.display = 'none';
        }
    });

    // Create/Update Post
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('post-id').value;
        const tagsInput = document.getElementById('tags').value;
        const postData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            tags: tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [],
            excerpt: document.getElementById('excerpt').value,
            content: document.getElementById('content').value,
            status: document.getElementById('status').value
        };

        try {
            let response;
            if (isEditing) {
                response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            } else {
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            }

            if (response.ok) {
                postModal.style.display = 'none';
                fetchPosts();
            } else {
                const errData = await response.json();
                alert('Error saving post: ' + (errData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving post:', error);
        }
    });

    // Delete Post
    window.deletePost = async (id) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchPosts();
            } else {
                alert('Error deleting post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    // Edit Post (Fetch single post data)
    window.editPost = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            const post = await response.json();

            isEditing = true;
            modalTitle.textContent = 'Edit Post';
            document.getElementById('post-id').value = post._id;
            document.getElementById('title').value = post.title;
            document.getElementById('author').value = post.author;
            document.getElementById('tags').value = (post.tags || []).join(', ');
            document.getElementById('excerpt').value = post.excerpt || '';
            document.getElementById('content').value = post.content;
            document.getElementById('status').value = post.status || 'published';

            postModal.style.display = 'flex';
        } catch (error) {
            console.error('Error fetching post details:', error);
        }
    };

    // Copy API URL
    window.copyApiUrl = (slug) => {
        const fullUrl = `${window.location.origin}/api/posts/${slug}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            alert('API Endpoint copied to clipboard: ' + fullUrl);
        });
    };

    // Initial load
    fetchPosts();
});
