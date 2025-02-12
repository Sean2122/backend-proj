const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import User model
const Cost = require('../models/Cost'); // Import Cost model

// Middleware to parse JSON requests
router.use(express.json());

/**
 * GET /api/users - Retrieve all users with their total costs
 */
router.get('/', async (req, res) => {
    try {
        const users = await User.find().lean(); // Use .lean() to improve performance by returning plain objects

        // Calculate total cost for each user
        const usersWithTotal = await Promise.all(users.map(async (user) => {
            const { createdAt, updatedAt, __v, ...userData } = user; // Exclude unnecessary fields

            // Aggregate total cost for the user
            const totalCost = await Cost.aggregate([
                { $match: { userid: user._id.toString() } }, // Match costs by user ID
                { $group: { _id: null, total: { $sum: "$sum" } } } // Sum up costs
            ]);

            const total = totalCost.length > 0 ? totalCost[0].total : 0; // Default to 0 if no costs exist

            // Format the birthday field, checking if it's a valid Date object
            const formattedBirthday = user.birthday instanceof Date ? user.birthday.toISOString().split('T')[0] : user.birthday;

            return {
                ...userData,
                total, // Include total cost in response
                birthday: formattedBirthday // Ensure birthday is formatted
            };
        }));

        res.json(usersWithTotal);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


/**
 * GET /api/users/:id - Retrieve a single user by ID with total costs
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Aggregate total cost for the user
        const totalCosts = await Cost.aggregate([
            { $match: { userid: req.params.id } }, // Match costs by user ID
            { $group: { _id: null, total: { $sum: "$sum" } } } // Sum up costs
        ]);

        const total = totalCosts.length > 0 ? totalCosts[0].total : 0; // Default to 0 if no costs exist

        // Exclude unnecessary fields from response
        const { createdAt, updatedAt, __v, ...userData } = user;

        // Format the birthday field, checking if it's a valid Date object
        const formattedBirthday = user.birthday instanceof Date ? user.birthday.toISOString().split('T')[0] : user.birthday;

        res.json({
            ...userData,
            total, // Include total cost in response
            birthday: formattedBirthday // Ensure birthday is formatted
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


/**
 * POST /api/users - Create a new user
 */
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, birthday, marital_status, email } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !birthday || !marital_status || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate birthday format
        if (isNaN(Date.parse(birthday))) {
            return res.status(400).json({ message: 'Invalid birthday format. Use YYYY-MM-DD' });
        }

        // Create and save new user
        const newUser = new User({ first_name, last_name, birthday, marital_status, email });
        await newUser.save();

        res.status(201).json(newUser);
    } catch (err) {
        console.error("Error in POST /api/users:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

/**
 * PUT /api/users/:id - Update a user by ID
 */
router.put('/:id', async (req, res) => {
    try {
        const { first_name, last_name, birthday, marital_status, email } = req.body;

        // Update user document
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { first_name, last_name, birthday, marital_status, email },
            { new: true } // Return updated document
        );

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

/**
 * DELETE /api/users/:id - Delete a user by ID
 */
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
