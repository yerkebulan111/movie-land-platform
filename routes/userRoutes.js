const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users
router.get('/', protect, authorize('admin'), userController.getAllUsers);

// DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), [
    param('id').isMongoId()
], userController.deleteUser);

module.exports = router;