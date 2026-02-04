const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const movieController = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/movies
// @desc    Get all movies with filtering, sorting, pagination
// @access  Public
router.get('/', movieController.getMovies);

// @route   GET /api/movies/search
// @desc    Search movies by text
// @access  Public
router.get('/search', movieController.searchMovies);

// @route   GET /api/movies/stats
// @desc    Get movie statistics (aggregation)
// @access  Public
router.get('/stats', movieController.getMovieStats);

// @route   GET /api/movies/top-rated
// @desc    Get top rated movies
// @access  Public
router.get('/top-rated', movieController.getTopRatedMovies);

// @route   GET /api/movies/:id
// @desc    Get single movie by ID
// @access  Public
router.get('/:id', [
    param('id').isMongoId()
], movieController.getMovieById);

// @route   POST /api/movies
// @desc    Create a new movie
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').trim().notEmpty().isLength({ max: 2000 }),
    body('year').isInt({ min: 1888 }),
    body('director').trim().notEmpty(),
    body('genre').isArray({ min: 1 })
], movieController.createMovie);

// @route   PUT /api/movies/:id
// @desc    Update a movie
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
    param('id').isMongoId()
], movieController.updateMovie);

// @route   DELETE /api/movies/:id
// @desc    Delete a movie
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), [
    param('id').isMongoId()
], movieController.deleteMovie);

// @route   POST /api/movies/:id/reviews
// @desc    Add a review to a movie
// @access  Private
router.post('/:id/reviews', protect, [
    param('id').isMongoId(),
    body('rating').isInt({ min: 1, max: 10 }),
    body('comment').trim().notEmpty().isLength({ max: 1000 })
], movieController.addReview);

// @route   PUT /api/movies/:id/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put('/:id/reviews/:reviewId', protect, [
    param('id').isMongoId(),
    param('reviewId').isMongoId()
], movieController.updateReview);

// @route   DELETE /api/movies/:id/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/:id/reviews/:reviewId', protect, [
    param('id').isMongoId(),
    param('reviewId').isMongoId()
], movieController.deleteReview);

module.exports = router;