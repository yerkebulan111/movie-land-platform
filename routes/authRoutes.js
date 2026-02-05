const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], authController.register);

// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], authController.login);

// GET /api/auth/me
router.get('/me', protect, authController.getMe);

// GET /api/auth/watchlist
router.get('/watchlist', protect, authController.getWatchlist);

// POST /api/auth/watchlist/:movieId
router.post('/watchlist/:movieId', protect, authController.addToWatchlist);

// DELETE /api/auth/watchlist/:movieId
router.delete('/watchlist/:movieId', protect, authController.removeFromWatchlist);

module.exports = router;