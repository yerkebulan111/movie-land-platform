document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
});

async function loadStatistics() {
    try {
        const data = await apiRequest('/movies/stats');
        
        if (data.success) {
            displayOverallStats(data.data.overallStats[0]);
            displayGenreStats(data.data.genreStats);
            displayDirectorStats(data.data.topDirectors);
            displayYearStats(data.data.yearStats);
        }
    } catch (error) {
        document.getElementById('overallStats').innerHTML = 
            `<p class="error-message">Error loading statistics: ${error.message}</p>`;
    }
}

function displayOverallStats(stats) {
    const container = document.getElementById('overallStats');
    
    container.innerHTML = `
        <div class="stat-box">
            <div class="stat-number">${stats.totalMovies}</div>
            <div class="stat-label">Total Movies</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${stats.avgRating.toFixed(1)}</div>
            <div class="stat-label">Average Rating</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${stats.totalReviews}</div>
            <div class="stat-label">Total Reviews</div>
        </div>
    `;
}

function displayGenreStats(genres) {
    const container = document.getElementById('genreStats');
    
    if (genres.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    container.innerHTML = genres.map(genre => `
        <div class="stat-item">
            <div>
                <strong>${genre._id}</strong>
                <div style="font-size: 0.9rem; color: var(--color-light);">
                    ${genre.count} ${genre.count === 1 ? 'movie' : 'movies'}
                </div>
            </div>
            <div>
                <span class="movie-rating">⭐ ${genre.avgRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}

function displayDirectorStats(directors) {
    const container = document.getElementById('directorStats');
    
    if (directors.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    container.innerHTML = directors.map(director => `
        <div class="stat-item">
            <div>
                <strong>${director._id}</strong>
                <div style="font-size: 0.9rem; color: var(--color-light);">
                    ${director.movieCount} ${director.movieCount === 1 ? 'movie' : 'movies'}
                </div>
            </div>
            <div>
                <span class="movie-rating">⭐ ${director.avgRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}

function displayYearStats(years) {
    const container = document.getElementById('yearStats');
    
    if (years.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    container.innerHTML = years.map(year => `
        <div class="stat-item">
            <div>
                <strong>${year._id}</strong>
                <div style="font-size: 0.9rem; color: var(--color-light);">
                    ${year.count} ${year.count === 1 ? 'movie' : 'movies'}
                </div>
            </div>
            <div>
                <span class="movie-rating">⭐ ${year.avgRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}