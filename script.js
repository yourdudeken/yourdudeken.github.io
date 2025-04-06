// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe elements that should animate
document.querySelectorAll('.profile, .social-icons a, nav a').forEach(el => {
    observer.observe(el);
});

// Add current year to footer
document.getElementById('year').textContent = new Date().getFullYear();

// Add small delay to profile animation for better effect
if (document.querySelector('.profile')) {
    document.querySelector('.profile').style.transitionDelay = '0.2s';
}

// Contact form handling
if (document.getElementById('contact-form')) {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                status.textContent = 'Message sent successfully!';
                status.className = 'success';
                form.reset();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            status.textContent = 'Oops! There was a problem sending your message.';
            status.className = 'error';
        }
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    });
}
