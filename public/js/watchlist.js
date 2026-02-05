document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    loadWatchlist();
});

async function loadWatchlist() {
    const container = document.getElementById('watchlistContainer');

    try {
        const data = await apiRequest('/auth/watchlist');

        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(movie => createMovieCard(movie, true)).join('');
        } else {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p style="font-size: 1.2rem; color: var(--color-light); margin-bottom: 1rem;">
                        Your watchlist is empty
                    </p>
                    <p style="color: var(--color-light); margin-bottom: 2rem;">
                        Start adding movies you want to watch!
                    </p>
                    <a href="/movies.html" class="btn btn-primary">Browse Movies</a>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading watchlist: ${error.message}</p>`;
    }
}

function createMovieCard(movie, showRemove = false) {
    return `
        <div class="movie-card">
            <img src="${movie.posterUrl}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.year}</span>
                    <span class="movie-rating">⭐ ${movie.ranking.toFixed(1)}</span>
                </div>
                <div class="movie-genres">
                    ${movie.genre.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <div class="movie-actions">
                    <button onclick="viewMovie('${movie._id}')" class="btn btn-primary" style="flex: 1;">Details</button>
                    ${showRemove ? `<button onclick="removeFromWatchlist('${movie._id}')" class="btn btn-danger">Remove</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function viewMovie(id) {
    window.location.href = `/movie-detail.html?id=${id}`;
}

async function removeFromWatchlist(movieId) {
    showConfirm(
        'Remove this movie from your watchlist?',
        async () => {
            try {
                await apiRequest(`/auth/watchlist/${movieId}`, {
                    method: 'DELETE'
                });

                showSuccess('Movie removed from watchlist!');
                setTimeout(() => loadWatchlist(), 1000);
            } catch (error) {
                showError('Error removing movie: ' + error.message);
            }
        },
        'Remove',
        'Cancel'
    );
}