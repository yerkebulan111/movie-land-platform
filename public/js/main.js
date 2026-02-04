document.addEventListener('DOMContentLoaded', async () => {
    loadTopRatedMovies();
    loadRecentMovies();
    setupSearch();
});

async function loadTopRatedMovies() {
    const container = document.getElementById('topMovies');
    
    try {
        const data = await apiRequest('/movies/top-rated?limit=4');
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(movie => createMovieCard(movie)).join('');
        } else {
            container.innerHTML = '<p>No movies found</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading movies: ${error.message}</p>`;
    }
}

async function loadRecentMovies() {
    const container = document.getElementById('recentMovies');
    
    try {
        const data = await apiRequest('/movies?limit=4&sortBy=createdAt&order=desc');
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(movie => createMovieCard(movie)).join('');
        } else {
            container.innerHTML = '<p>No movies found</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading movies: ${error.message}</p>`;
    }
}

function createMovieCard(movie) {
    return `
        <div class="movie-card" onclick="viewMovie('${movie._id}')">
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
            </div>
        </div>
    `;
}

function viewMovie(id) {
    window.location.href = `/movie-detail.html?id=${id}`;
}

function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        window.location.href = `/movies.html?search=${encodeURIComponent(query)}`;
    }
}