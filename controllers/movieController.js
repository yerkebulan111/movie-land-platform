const Movie = require('../models/Movie');
const { validationResult } = require('express-validator');

// @desc    Get all movies with filtering, sorting, and pagination
// @route   GET /api/movies
// @access  Public
exports.getMovies = async (req, res, next) => {
    try {
        const { 
            genre, 
            year, 
            director, 
            minRating, 
            sortBy = 'createdAt', 
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;
        
        // Build query
        const query = {};
        
        if (genre) {
            query.genre = genre;
        }
        
        if (year) {
            query.year = parseInt(year);
        }
        
        if (director) {
            query.director = new RegExp(director, 'i');
        }
        
        if (minRating) {
            query.ranking = { $gte: parseFloat(minRating) };
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'asc' ? 1 : -1;
        
        const movies = await Movie.find(query)
            .sort({ [sortBy]: sortOrder })
            .limit(parseInt(limit))
            .skip(skip)
            .select('-reviews');
        
        const total = await Movie.countDocuments(query);
        
        res.status(200).json({
            success: true,
            count: movies.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: movies
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search movies by text
// @route   GET /api/movies/search
// @access  Public
exports.searchMovies = async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search query'
            });
        }
        
        const movies = await Movie.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .select('-reviews');
        
        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get movie statistics (aggregation pipeline)
// @route   GET /api/movies/stats
// @access  Public
exports.getMovieStats = async (req, res, next) => {
    try {
        const stats = await Movie.aggregate([
            {
                $facet: {
                    genreStats: [
                        { $unwind: '$genre' },
                        {
                            $group: {
                                _id: '$genre',
                                count: { $sum: 1 },
                                avgRating: { $avg: '$ranking' },
                                maxRating: { $max: '$ranking' }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    yearStats: [
                        {
                            $group: {
                                _id: '$year',
                                count: { $sum: 1 },
                                avgRating: { $avg: '$ranking' }
                            }
                        },
                        { $sort: { _id: -1 } },
                        { $limit: 10 }
                    ],
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                totalMovies: { $sum: 1 },
                                avgRating: { $avg: '$ranking' },
                                totalReviews: { $sum: { $size: '$reviews' } }
                            }
                        }
                    ],
                    topDirectors: [
                        {
                            $group: {
                                _id: '$director',
                                movieCount: { $sum: 1 },
                                avgRating: { $avg: '$ranking' }
                            }
                        },
                        { $match: { movieCount: { $gt: 0 } } },
                        { $sort: { movieCount: -1, avgRating: -1 } },
                        { $limit: 10 }
                    ]
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
exports.getTopRatedMovies = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        
        const movies = await Movie.aggregate([
            {
                $match: {
                    ranking: { $gt: 0 },
                    reviews: { $exists: true, $ne: [] }
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: '$reviews' }
                }
            },
            {
                $match: {
                    reviewCount: { $gte: 1 }
                }
            },
            {
                $sort: { ranking: -1, reviewCount: -1 }
            },
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    reviews: 0
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new movie
// @route   POST /api/movies
// @access  Private (Admin)
exports.createMovie = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        req.body.createdBy = req.user.id;
        
        const movie = await Movie.create(req.body);
        
        res.status(201).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private (Admin)
exports.updateMovie = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        let movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        // Don't allow updating reviews through this endpoint
        delete req.body.reviews;
        
        movie = await Movie.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            {
                new: true,
                runValidators: true
            }
        );
        
        res.status(200).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private (Admin)
exports.deleteMovie = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        await Movie.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Movie deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a review to a movie
// @route   POST /api/movies/:id/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        // Check if user has already reviewed
        if (movie.hasUserReviewed(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this movie'
            });
        }
        
        const review = {
            user: req.user.id,
            username: req.user.username,
            rating: req.body.rating,
            comment: req.body.comment
        };
        
        movie.reviews.push(review);
        movie.updateRanking();
        
        await movie.save();
        
        res.status(201).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a review
// @route   PUT /api/movies/:id/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        const review = movie.reviews.id(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check if user owns the review
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }
        
        // Update review fields using $set operator
        if (req.body.rating) review.rating = req.body.rating;
        if (req.body.comment) review.comment = req.body.comment;
        
        movie.updateRanking();
        await movie.save();
        
        res.status(200).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a review
// @route   DELETE /api/movies/:id/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        const review = movie.reviews.id(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check if user owns the review or is admin
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }
        
        // Use $pull operator to remove review
        movie.reviews.pull(req.params.reviewId);
        movie.updateRanking();
        
        await movie.save();
        
        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: movie
        });
    } catch (error) {
        next(error);
    }
};