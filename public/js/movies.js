let currentPage = 1;
let currentFilters = {};
let isSearchMode = false;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        document.getElementById('movieSearch').value = searchQuery;
        searchMovies(searchQuery);
    } else {
        loadMovies();
    }
    
    setupFilters();
    setupSearch();
});

function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearch');
    const searchInput = document.getElementById('movieSearch');
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchMovies(query);
        }
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        isSearchMode = false;
        loadMovies(1);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchMovies(query);
            }
        }
    });
}

async function loadMovies(page = 1) {
    const container = document.getElementById('moviesContainer');
    container.innerHTML = '<div class="loader"></div>';
    isSearchMode = false;
    
    try {
        const queryParams = new URLSearchParams({
            page,
            limit: 12,
            ...currentFilters
        });
        
        const data = await apiRequest(`/movies?${queryParams}`);
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(movie => createMovieCard(movie)).join('');
            updatePagination(data.page, data.pages);
            currentPage = page;
        } else {
            container.innerHTML = '<p>No movies found</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading movies: ${error.message}</p>`;
    }
}

async function searchMovies(query) {
    const container = document.getElementById('moviesContainer');
    container.innerHTML = '<div class="loader"></div>';
    isSearchMode = true;
    
    try {
        const data = await apiRequest(`/movies/search?q=${encodeURIComponent(query)}`);
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(movie => createMovieCard(movie)).join('');
            document.getElementById('pagination').innerHTML = '';
        } else {
            container.innerHTML = '<p>No movies found matching your search</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error searching movies: ${error.message}</p>`;
    }
}

function setupFilters() {
    const applyBtn = document.getElementById('applyFilters');
    
    applyBtn.addEventListener('click', () => {
        if (isSearchMode) {
            alert('Please clear search first to use filters');
            return;
        }
        
        const genre = document.getElementById('genreFilter').value;
        const minRating = document.getElementById('ratingFilter').value;
        const sortBy = document.getElementById('sortFilter').value;
        
        currentFilters = {};
        if (genre) currentFilters.genre = genre;
        if (minRating) currentFilters.minRating = minRating;
        if (sortBy) currentFilters.sortBy = sortBy;
        
        loadMovies(1);
    });
}

function createMovieCard(movie) {
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
                    ${movie.genre.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <div class="movie-actions">
                    <button onclick="viewMovie('${movie._id}')" class="btn btn-primary" style="flex: 1;">Show Details</button>
                    ${isAuthenticated() ? `<button onclick="toggleWatchlist('${movie._id}', event)" class="btn btn-secondary watchlist-btn" data-movie-id="${movie._id}">+ Watchlist</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function viewMovie(id) {
    window.location.href = `/movie-detail.html?id=${id}`;
}

async function toggleWatchlist(movieId, event) {
    event.stopPropagation();
    const button = event.target;
    
    try {
        if (button.classList.contains('in-watchlist')) {
            await apiRequest(`/auth/watchlist/${movieId}`, { method: 'DELETE' });
            button.textContent = '+ Watchlist';
            button.classList.remove('in-watchlist');
            showSuccess('Removed from watchlist');
        } else {
            await apiRequest(`/auth/watchlist/${movieId}`, { method: 'POST' });
            button.textContent = '✓ In Watchlist';
            button.classList.add('in-watchlist');
            showSuccess('Added to watchlist!');
        }
    } catch (error) {
        if (error.message.includes('already in watchlist')) {
            button.textContent = '✓ In Watchlist';
            button.classList.add('in-watchlist');
        } else {
            showError(error.message);
        }
    }
}

function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    
    html += `<button onclick="loadMovies(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
    
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button onclick="loadMovies(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }
    
    
    html += `<button onclick="loadMovies(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    
    pagination.innerHTML = html;
}