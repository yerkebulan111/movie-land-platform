const API_URL = 'http://localhost:3000/api';


function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}


function getToken() {
    return localStorage.getItem('token');
}


function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}


function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}


function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}


function updateNavigation() {
    const authNav = document.getElementById('authNav');
    const userNav = document.getElementById('userNav');
    const welcomeUser = document.getElementById('welcomeUser');
    const adminLink = document.getElementById('adminLink');
    const watchlistNav = document.getElementById('watchlistNav');

    if (isAuthenticated()) {
        const user = getCurrentUser();
        if (authNav) authNav.style.display = 'none';
        if (userNav) userNav.style.display = 'flex';
        if (welcomeUser) welcomeUser.textContent = `Welcome, ${user.username}`;
        if (watchlistNav) watchlistNav.style.display = 'block';

        
        if (adminLink && ['admin', 'moderator'].includes(user.role)) {
            adminLink.style.display = 'inline';
            if (user.role === 'moderator') {
                adminLink.textContent = 'Moderator Panel';
            }
        }
    } else {
        if (authNav) authNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
        if (watchlistNav) watchlistNav.style.display = 'none';
    }
}


function logout() {
    showConfirm(
        'Are you sure you want to logout?',
        () => {
            clearAuthData();
            window.location.href = '/';
        },
        'Yes, Logout',
        'Cancel'
    );
}


document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});


async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error;
    }
}