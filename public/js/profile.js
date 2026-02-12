document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const modal = document.getElementById('passwordModal');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeModal = document.querySelector('.close-modal');
    const passwordForm = document.getElementById('passwordForm');

    let userData = {};

    await loadProfile();

    async function loadProfile() {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                userData = data.data;
                updateDisplay(userData);
            } else {
                showError('Failed to load profile data');
            }
        } catch (error) {
            showError('Error fetching profile');
        }
    }

    function updateDisplay(user) {
        document.getElementById('usernameDisplay').textContent = user.username;
        document.getElementById('usernameInput').value = user.username;

        document.getElementById('emailDisplay').textContent = user.email;
        document.getElementById('emailInput').value = user.email;

        document.getElementById('roleDisplay').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = user.role.toUpperCase();
        roleBadge.className = `role-badge ${user.role}`;
    }

    
    window.toggleEdit = function (field, isEditMode) {
        const displayEl = document.getElementById(`${field}Display`);
        const editFormEl = document.getElementById(`${field}EditForm`);
        const actionsEl = document.getElementById(`${field}Actions`);

        if (isEditMode) {
            displayEl.classList.add('hidden');
            actionsEl.classList.add('hidden');
            editFormEl.classList.remove('hidden');
        } else {
            document.getElementById(`${field}Input`).value = userData[field];

            displayEl.classList.remove('hidden');
            actionsEl.classList.remove('hidden');
            editFormEl.classList.add('hidden');
        }
    };

    window.saveField = async function (field) {
        const inputVal = document.getElementById(`${field}Input`).value;
        const updates = {};
        updates[field] = inputVal;

        const payload = {
            username: userData.username,
            email: userData.email,
            ...updates
        };

        try {
            const res = await fetch('/api/auth/updatedetails', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                userData = data.data;
                updateDisplay(userData);
                toggleEdit(field, false);
                showSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
            } else {
                showError(data.message || 'Update failed');
            }
        } catch (error) {
            showError('Server error during update');
        }
    };

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            passwordForm.reset();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            passwordForm.reset();
        }
    });

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showError('New passwords do not match');
                return;
            }

            try {
                const res = await fetch('/api/auth/updatepassword', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await res.json();

                if (data.success) {
                    showSuccess('Password updated successfully');
                    passwordForm.reset();
                    modal.classList.remove('active');
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                } else {
                    showError(data.message || 'Error updating password');
                }
            } catch (error) {
                showError('Server error occurred');
            }
        });
    }
});
