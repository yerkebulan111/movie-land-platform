document.addEventListener('DOMContentLoaded', () => {
    
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    const user = getCurrentUser();
    if (!['admin', 'moderator'].includes(user.role)) {
        alert('Access denied. Admin/Moderator only.');
        window.location.href = '/';
        return;
    }

    loadAllMovies();

    
    if (user.role === 'admin') {
        loadAllUsers();
    } else {
        const usersTable = document.getElementById('usersTable');
        if (usersTable) usersTable.style.display = 'none';

        
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) pageTitle.textContent = 'Moderator Panel';
    }

    setupForms();
});

async function loadAllMovies() {
    const container = document.getElementById('moviesTable');

    try {
        const data = await apiRequest('/movies?limit=100');

        if (data.success && data.data.length > 0) {
            displayMoviesTable(data.data);
        } else {
            container.innerHTML = '<p>No movies found</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading movies: ${error.message}</p>`;
    }
}

function displayMoviesTable(movies) {
    const container = document.getElementById('moviesTable');

    container.innerHTML = `
        <h2>All Movies (${movies.length})</h2>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Director</th>
                        <th>Rating</th>
                        <th>Reviews</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${movies.map(movie => `
                        <tr>
                            <td>${movie.title}</td>
                            <td>${movie.year}</td>
                            <td>${movie.director}</td>
                            <td>⭐ ${movie.ranking.toFixed(1)}</td>
                            <td>${movie.reviewCount || 0}</td>
                            <td class="actions">
                                <button onclick="editMovie('${movie._id}')" class="btn btn-secondary">Edit</button>
                                <button onclick="deleteMovie('${movie._id}')" class="btn btn-danger">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function setupForms() {
    
    document.getElementById('showAddForm').addEventListener('click', () => {
        document.getElementById('addMovieForm').style.display = 'block';
        document.getElementById('editMovieForm').style.display = 'none';
    });

    
    document.getElementById('cancelForm').addEventListener('click', () => {
        document.getElementById('addMovieForm').style.display = 'none';
        document.getElementById('movieForm').reset();
    });

    
    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.getElementById('editMovieForm').style.display = 'none';
        document.getElementById('editForm').reset();
    });

    
    document.getElementById('movieForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';

        const formData = {
            title: document.getElementById('title').value,
            year: parseInt(document.getElementById('year').value),
            director: document.getElementById('director').value,
            genre: Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(cb => cb.value),
            cast: document.getElementById('cast').value.split(',').map(s => s.trim()).filter(s => s),
            description: document.getElementById('description').value,
            posterUrl: document.getElementById('posterUrl').value || undefined,
            trailerUrl: document.getElementById('trailerUrl').value || undefined
        };

        try {
            await apiRequest('/movies', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showSuccess('Movie added successfully!');
            document.getElementById('addMovieForm').style.display = 'none';
            document.getElementById('movieForm').reset();
            loadAllMovies();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });

    
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const errorDiv = document.getElementById('editFormError');
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';

        const movieId = document.getElementById('editMovieId').value;
        const formData = {
            title: document.getElementById('editTitle').value,
            year: parseInt(document.getElementById('editYear').value),
            director: document.getElementById('editDirector').value,
            genre: Array.from(document.querySelectorAll('input[name="editGenre"]:checked')).map(cb => cb.value),
            cast: document.getElementById('editCast').value.split(',').map(s => s.trim()).filter(s => s),
            description: document.getElementById('editDescription').value,
            posterUrl: document.getElementById('editPosterUrl').value || undefined,
            trailerUrl: document.getElementById('editTrailerUrl').value || undefined
        };

        try {
            await apiRequest(`/movies/${movieId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            showSuccess('Movie updated successfully!');
            document.getElementById('editMovieForm').style.display = 'none';
            document.getElementById('editForm').reset();
            loadAllMovies();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function editMovie(movieId) {
    try {
        const data = await apiRequest(`/movies/${movieId}`);

        if (data.success) {
            const movie = data.data;

            document.getElementById('editMovieId').value = movie._id;
            document.getElementById('editTitle').value = movie.title;
            document.getElementById('editYear').value = movie.year;
            document.getElementById('editDirector').value = movie.director;
            document.getElementById('editCast').value = movie.cast.join(', ');
            document.getElementById('editDescription').value = movie.description;
            document.getElementById('editPosterUrl').value = movie.posterUrl;
            document.getElementById('editTrailerUrl').value = movie.trailerUrl || '';

            
            document.querySelectorAll('input[name="editGenre"]').forEach(checkbox => {
                checkbox.checked = movie.genre.includes(checkbox.value);
            });

            document.getElementById('addMovieForm').style.display = 'none';
            document.getElementById('editMovieForm').style.display = 'block';
        }
    } catch (error) {
        showError('Error loading movie: ' + error.message);
    }
}

async function deleteMovie(movieId) {
    showConfirm(
        'Are you sure you want to delete this movie? This action cannot be undone.',
        async () => {
            try {
                await apiRequest(`/movies/${movieId}`, {
                    method: 'DELETE'
                });

                showSuccess('Movie deleted successfully!');
                loadAllMovies();
            } catch (error) {
                showError('Error deleting movie: ' + error.message);
            }
        },
        'Delete',
        'Cancel'
    );
}


async function loadAllUsers() {
    const container = document.getElementById('usersTable');

    try {
        const data = await apiRequest('/users');

        if (data.success && data.data.length > 0) {
            displayUsersTable(data.data);
        } else {
            container.innerHTML = '<p>No users found</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading users: ${error.message}</p>`;
    }
}

function displayUsersTable(users) {
    const container = document.getElementById('usersTable');
    const currentUser = getCurrentUser();

    container.innerHTML = `
        <h2>All Users (${users.length})</h2>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registered</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td><span class="role-badge ${user.role}">${user.role.toUpperCase()}</span></td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td class="actions">
                                ${user._id !== currentUser.id ?
            `<button onclick="deleteUser('${user._id}', '${user.username}')" class="btn btn-danger">Delete</button>` :
            `<span style="color: var(--color-light);">Current User</span>`
        }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function deleteUser(userId, username) {
    showConfirm(
        `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
        async () => {
            try {
                await apiRequest(`/users/${userId}`, {
                    method: 'DELETE'
                });

                showSuccess('User deleted successfully!');
                loadAllUsers();
            } catch (error) {
                showError('Error deleting user: ' + error.message);
            }
        },
        'Delete User',
        'Cancel'
    );
}