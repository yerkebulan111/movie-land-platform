document.addEventListener('DOMContentLoaded', () => {
    
    if (isAuthenticated()) {
        window.location.href = '/';
        return;
    }
    
    const form = document.getElementById('registerForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('errorMessage');
        
        
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }
        
        try {
            console.log('Attempting registration with:', { username, email });
            
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            
            saveAuthData(data.token, data.user);
            
            
            showSuccess('Registration successful! Welcome to MovieLand.', '/');
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });
});


function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.parentElement.querySelector('.password-toggle');
    
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁️';
    }
}