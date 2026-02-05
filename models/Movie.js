const mongoose = require('mongoose');

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
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
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



movieSchema.methods.updateRanking = async function () {
    
    const mongoose = require('mongoose');
    const Review = mongoose.model('Review');

    const reviews = await Review.find({ movie: this._id });

    if (reviews.length === 0) {
        this.ranking = 0;
    } else {
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        this.ranking = (sum / reviews.length).toFixed(1);
    }

    return this.ranking;
};

module.exports = mongoose.model('Movie', movieSchema);