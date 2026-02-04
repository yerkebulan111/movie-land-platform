const API_URL = 'http://localhost:3000/api';

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user data from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Save auth data to localStorage
function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Clear auth data from localStorage
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Update navigation based on authentication status
function updateNavigation() {
    const authNav = document.getElementById('authNav');
    const userNav = document.getElementById('userNav');
    const welcomeUser = document.getElementById('welcomeUser');
    const adminLink = document.getElementById('adminLink');
    
    if (isAuthenticated()) {
        const user = getCurrentUser();
        if (authNav) authNav.style.display = 'none';
        if (userNav) userNav.style.display = 'flex';
        if (welcomeUser) welcomeUser.textContent = `Welcome, ${user.username}`;
        
        // Show admin link only for admin users
        if (adminLink && user.role === 'admin') {
            adminLink.style.display = 'inline';
        }
    } else {
        if (authNav) authNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }
}

// Logout function
function logout() {
    clearAuthData();
    window.location.href = '/';
}

// Setup logout button
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

// Make API request with authentication
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