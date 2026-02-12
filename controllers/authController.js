const User = require('../models/User');
const { validationResult } = require('express-validator');


exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { username, email, password } = req.body;


        const user = await User.create({
            username,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
};



exports.login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { email, password } = req.body;


        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }


        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};


exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};



exports.getWatchlist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('watchlist');

        res.status(200).json({
            success: true,
            count: user.watchlist.length,
            data: user.watchlist
        });
    } catch (error) {
        next(error);
    }
};



exports.addToWatchlist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);


        if (user.watchlist.includes(req.params.movieId)) {
            return res.status(400).json({
                success: false,
                message: 'Movie already in watchlist'
            });
        }

        user.watchlist.push(req.params.movieId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Movie added to watchlist'
        });
    } catch (error) {
        next(error);
    }
};


exports.removeFromWatchlist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        user.watchlist = user.watchlist.filter(
            id => id.toString() !== req.params.movieId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Movie removed from watchlist'
        });
    } catch (error) {
        next(error);
    }
};


const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
};


exports.updateDetails = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            username: req.body.username,
            email: req.body.email
        };

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};


exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect current password'
            });
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

