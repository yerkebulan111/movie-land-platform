const User = require('../models/User');
const Movie = require('../models/Movie');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');


// GET /api/users
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};



// DELETE /api/users/:id

exports.deleteUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }


        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        
        const reviews = await Review.find({ user: user._id });

        
        for (const review of reviews) {
            const movie = await Movie.findById(review.movie);
            if (movie) {
                movie.reviews.pull(review._id);
                await movie.updateRanking(); 
                await movie.save();
            }
        }

        
        await Review.deleteMany({ user: user._id });

        
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};