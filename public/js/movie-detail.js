let currentMovieId = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentMovieId = urlParams.get('id');
    
    if (currentMovieId) {
        loadMovieDetail();
    } else {
        document.getElementById('movieDetail').innerHTML = '<p class="error-message">No movie ID provided</p>';
    }
});

async function loadMovieDetail() {
    const container = document.getElementById('movieDetail');
    
    try {
        const data = await apiRequest(`/movies/${currentMovieId}`);
        
        if (data.success) {
            displayMovieDetail(data.data);
            displayReviews(data.data.reviews);
            
            // Show review form if user is logged in and hasn't reviewed yet
            if (isAuthenticated()) {
                const user = getCurrentUser();
                const hasReviewed = data.data.reviews.some(r => r.user === user.id);
                
                if (!hasReviewed) {
                    document.getElementById('reviewForm').style.display = 'block';
                    setupReviewForm();
                }
            }
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading movie: ${error.message}</p>`;
    }
}

function displayMovieDetail(movie) {
    const container = document.getElementById('movieDetail');
    
    const trailerEmbed = movie.trailerUrl ? getYouTubeEmbedUrl(movie.trailerUrl) : null;
    
    container.innerHTML = `
        <div class="movie-detail-grid">
            <div>
                <img src="${movie.posterUrl}" alt="${movie.title}" class="movie-detail-poster">
            </div>
            <div class="movie-detail-info">
                <h1>${movie.title}</h1>
                <div class="movie-detail-meta">
                    <span><strong>Year:</strong> ${movie.year}</span>
                    <span><strong>Rating:</strong> ⭐ ${movie.ranking.toFixed(1)}/10</span>
                    <span><strong>Reviews:</strong> ${movie.reviews.length}</span>
                </div>
                <div class="movie-genres">
                    ${movie.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <div class="movie-detail-description">
                    <h3>Description</h3>
                    <p>${movie.description}</p>
                </div>
                <div>
                    <strong>Director:</strong> ${movie.director}
                </div>
                ${movie.cast && movie.cast.length > 0 ? `
                    <div class="movie-detail-cast">
                        <strong>Cast:</strong>
                        <div class="cast-list">
                            ${movie.cast.map(actor => `<span class="cast-item">${actor}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
        ${trailerEmbed ? `
            <div class="trailer-container">
                <h3>Trailer</h3>
                <iframe src="${trailerEmbed}" frameborder="0" allowfullscreen></iframe>
            </div>
        ` : ''}
    `;
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        return;
    }
    
    const sortedReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = sortedReviews.map(review => {
        const currentUser = getCurrentUser();
        const isOwner = currentUser && currentUser.id === review.user;
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-user">${review.username}</span>
                    <span class="review-rating">⭐ ${review.rating}/10</span>
                </div>
                <p class="review-comment">${review.comment}</p>
                <p class="review-date">${new Date(review.createdAt).toLocaleDateString()}</p>
                ${isOwner ? `
                    <div class="review-actions">
                        <button onclick="deleteReview('${review._id}')" class="btn btn-danger">Delete</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function setupReviewForm() {
    const form = document.getElementById('addReviewForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rating = document.getElementById('reviewRating').value;
        const comment = document.getElementById('reviewComment').value;
        
        try {
            await apiRequest(`/movies/${currentMovieId}/reviews`, {
                method: 'POST',
                body: JSON.stringify({ rating: parseInt(rating), comment })
            });
            
            // Reload the page to show new review
            window.location.reload();
        } catch (error) {
            alert('Error adding review: ' + error.message);
        }
    });
}

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }
    
    try {
        await apiRequest(`/movies/${currentMovieId}/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        
        // Reload the page
        window.location.reload();
    } catch (error) {
        alert('Error deleting review: ' + error.message);
    }
}

function getYouTubeEmbedUrl(url) {
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return null;
}