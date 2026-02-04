const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a movie title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    year: {
        type: Number,
        required: [true, 'Please add a release year'],
        min: [1888, 'Year must be 1888 or later'],
        max: [new Date().getFullYear() + 5, 'Year cannot be too far in the future']
    },
    director: {
        type: String,
        required: [true, 'Please add a director'],
        trim: true
    },
    cast: [{
        type: String,
        trim: true
    }],
    ranking: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    genre: [{
        type: String,
        enum: [
            'Action', 'Adventure', 'Animation', 'Biography', 'Comedy',
            'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy',
            'Film-Noir', 'History', 'Horror', 'Musical', 'Mystery',
            'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
        ]
    }],
    reviews: [reviewSchema],
    posterUrl: {
        type: String,
        default: 'https://via.placeholder.com/300x450?text=No+Poster'
    },
    trailerUrl: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Update ranking based on reviews
movieSchema.methods.updateRanking = function() {
    if (this.reviews.length === 0) {
        this.ranking = 0;
    } else {
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.ranking = (sum / this.reviews.length).toFixed(1);
    }
};

// Check if user has already reviewed
movieSchema.methods.hasUserReviewed = function(userId) {
    return this.reviews.some(review => review.user.toString() === userId.toString());
};

module.exports = mongoose.model('Movie', movieSchema);