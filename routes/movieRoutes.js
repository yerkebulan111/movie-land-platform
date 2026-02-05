const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const movieController = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/movies
router.get('/', movieController.getMovies);

// GET /api/movies/search
router.get('/search', movieController.searchMovies);

// GET /api/movies/stats
router.get('/stats', movieController.getMovieStats);

// GET /api/movies/top-rated
router.get('/top-rated', movieController.getTopRatedMovies);

// GET /api/movies/:id
router.get('/:id', [
    param('id').isMongoId()
], movieController.getMovieById);

// POST /api/movies
router.post('/', protect, authorize('admin', 'moderator'), [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').trim().notEmpty().isLength({ max: 2000 }),
    body('year').isInt({ min: 1888 }),
    body('director').trim().notEmpty(),
    body('genre').isArray({ min: 1 })
], movieController.createMovie);

// PUT /api/movies/:id
router.put('/:id', protect, authorize('admin', 'moderator'), [
    param('id').isMongoId()
], movieController.updateMovie);

// DELETE /api/movies/:id
router.delete('/:id', protect, authorize('admin', 'moderator'), [
    param('id').isMongoId()
], movieController.deleteMovie);

// POST /api/movies/:id/reviews
router.post('/:id/reviews', protect, [
    param('id').isMongoId(),
    body('rating').isInt({ min: 1, max: 10 }),
    body('comment').trim().notEmpty().isLength({ max: 1000 })
], movieController.addReview);

// PUT /api/movies/:id/reviews/:reviewId
router.put('/:id/reviews/:reviewId', protect, [
    param('id').isMongoId(),
    param('reviewId').isMongoId()
], movieController.updateReview);

// DELETE /api/movies/:id/reviews/:reviewId
router.delete('/:id/reviews/:reviewId', protect, [
    param('id').isMongoId(),
    param('reviewId').isMongoId()
], movieController.deleteReview);

module.exports = router;