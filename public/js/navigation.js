
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        
        link.classList.remove('active');
        
        
        if (currentPath === '/' || currentPath === '/index.html') {
        
            if (href === '/' || href === '/index.html') {
                link.classList.add('active');
            }
        } else if (href !== '/' && href !== '/index.html' && currentPath.includes(href.replace('/', ''))) {
            link.classList.add('active');
        }
    });
});