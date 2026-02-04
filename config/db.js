const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Create indexes
        await createIndexes();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        const Movie = require('../models/Movie');
        const User = require('../models/User');
        
        // Compound index for movie search and filtering
        await Movie.collection.createIndex({ title: 1, year: -1 });
        await Movie.collection.createIndex({ genre: 1, ranking: -1 });
        await Movie.collection.createIndex({ director: 1 });
        
        // Text index for search
        await Movie.collection.createIndex({ 
            title: 'text', 
            description: 'text', 
            director: 'text' 
        });
        
        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ username: 1 }, { unique: true });
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error.message);
    }
};

module.exports = connectDB;