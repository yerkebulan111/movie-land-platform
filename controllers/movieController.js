const Movie = require('../models/Movie');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');


// GET /api/movies

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
            .populate({
                path: 'reviews',
                select: 'rating comment username user createdAt'
            })
            .sort({ [sortBy]: sortOrder })
            .limit(parseInt(limit))
            .skip(skip);

        
        const moviesWithCount = movies.map(movie => {
            const movieObj = movie.toObject();
            const reviewCount = movieObj.reviews ? movieObj.reviews.length : 0;
            delete movieObj.reviews;
            return { ...movieObj, reviewCount };
        });

        const total = await Movie.countDocuments(query);

        res.status(200).json({
            success: true,
            count: moviesWithCount.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: moviesWithCount
        });
    } catch (error) {
        next(error);
    }
};


// GET /api/movies/search

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



// GET /api/movies/stats

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



// @route   GET /api/movies/top-rated

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


// GET /api/movies/:id

exports.getMovieById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const movie = await Movie.findById(req.params.id)
            .populate({
                path: 'reviews',
                select: 'rating comment username user createdAt'
            });

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



// POST /api/movies

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


// PUT /api/movies/:id

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


// DELETE /api/movies/:id

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


// POST /api/movies/:id/reviews

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

        
        const existingReview = await Review.findOne({
            movie: req.params.id,
            user: req.user.id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this movie'
            });
        }

        const review = await Review.create({
            user: req.user.id,
            movie: req.params.id,
            username: req.user.username,
            rating: req.body.rating,
            comment: req.body.comment
        });

        movie.reviews.push(review._id);

        
        await movie.updateRanking();
        await movie.save();

        res.status(201).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};



// @route   PUT /api/movies/:id/reviews/:reviewId

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

        let review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        
        if (req.body.rating) review.rating = req.body.rating;
        if (req.body.comment) review.comment = req.body.comment;

        await review.save();

        await movie.updateRanking();
        await movie.save();

        res.status(200).json({
            success: true,
            data: movie
        });
    } catch (error) {
        next(error);
    }
};



// DELETE /api/movies/:id/reviews/:reviewId
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

        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        
        await Review.findByIdAndDelete(req.params.reviewId);
    
        movie.reviews.pull(req.params.reviewId);

        await movie.updateRanking();
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