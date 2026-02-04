document.addEventListener('DOMContentLoaded', () => {
    // Check if user is admin
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    
    const user = getCurrentUser();
    if (user.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = '/';
        return;
    }
    
    loadAllMovies();
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
                            <td>${movie.reviews ? movie.reviews.length : 0}</td>
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
    // Show add form
    document.getElementById('showAddForm').addEventListener('click', () => {
        document.getElementById('addMovieForm').style.display = 'block';
        document.getElementById('editMovieForm').style.display = 'none';
    });
    
    // Cancel add form
    document.getElementById('cancelForm').addEventListener('click', () => {
        document.getElementById('addMovieForm').style.display = 'none';
        document.getElementById('movieForm').reset();
    });
    
    // Cancel edit form
    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.getElementById('editMovieForm').style.display = 'none';
        document.getElementById('editForm').reset();
    });
    
    // Add movie form
    document.getElementById('movieForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('title').value,
            year: parseInt(document.getElementById('year').value),
            director: document.getElementById('director').value,
            genre: Array.from(document.getElementById('genre').selectedOptions).map(o => o.value),
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
            
            alert('Movie added successfully!');
            document.getElementById('addMovieForm').style.display = 'none';
            document.getElementById('movieForm').reset();
            loadAllMovies();
        } catch (error) {
            document.getElementById('formError').textContent = error.message;
        }
    });
    
    // Edit movie form
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const movieId = document.getElementById('editMovieId').value;
        const formData = {
            title: document.getElementById('editTitle').value,
            year: parseInt(document.getElementById('editYear').value),
            director: document.getElementById('editDirector').value,
            genre: Array.from(document.getElementById('editGenre').selectedOptions).map(o => o.value),
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
            
            alert('Movie updated successfully!');
            document.getElementById('editMovieForm').style.display = 'none';
            document.getElementById('editForm').reset();
            loadAllMovies();
        } catch (error) {
            document.getElementById('editFormError').textContent = error.message;
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
            
            // Set selected genres
            const genreSelect = document.getElementById('editGenre');
            Array.from(genreSelect.options).forEach(option => {
                option.selected = movie.genre.includes(option.value);
            });
            
            document.getElementById('addMovieForm').style.display = 'none';
            document.getElementById('editMovieForm').style.display = 'block';
        }
    } catch (error) {
        alert('Error loading movie: ' + error.message);
    }
}

async function deleteMovie(movieId) {
    if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiRequest(`/movies/${movieId}`, {
            method: 'DELETE'
        });
        
        alert('Movie deleted successfully!');
        loadAllMovies();
    } catch (error) {
        alert('Error deleting movie: ' + error.message);
    }
}