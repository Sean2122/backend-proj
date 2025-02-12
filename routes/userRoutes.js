const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cost = require('../models/Cost'); // Import the Cost model

// Middleware to parse JSON requests
router.use(express.json());

// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().lean(); // Use .lean() to get plain objects

        // Get total costs for each user
        const usersWithTotal = await Promise.all(users.map(async (user) => {
            const { createdAt, updatedAt, __v, ...userData } = user;

            // Convert user._id to string to match the userid stored in cost
            const totalCost = await Cost.aggregate([
                { $match: { userid: user._id.toString() } }, // Convert _id to string for comparison
                { $group: { _id: null, total: { $sum: "$sum" } } } // Aggregate sum of costs
            ]);

            const total = totalCost.length > 0 ? totalCost[0].total : 0; // Default to 0 if no costs exist

            return {
                ...userData,
                total, // Add the total cost to the user data
                birthday: user.birthday.toISOString().split('T')[0] // Format birthday
            };
        }));

        res.json(usersWithTotal);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// GET a single user by ID with total costs
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).lean(); // Use .lean() to get plain object
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get total cost for the user
        const totalCosts = await Cost.aggregate([
            { $match: { userid: req.params.id } }, // Match costs by user ID
            { $group: { _id: null, total: { $sum: "$sum" } } } // Sum up the costs
        ]);

        const total = totalCosts.length > 0 ? totalCosts[0].total : 0; // If costs exist, sum them, else 0

        // Destructure and remove unwanted fields
        const { createdAt, updatedAt, __v, ...userData } = user;

        res.json({
            ...userData,
            total: total // Add the total costs
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/users - Add a new user
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, birthday, marital_status, email } = req.body;

        if (!first_name || !last_name || !birthday || !marital_status || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate birthday format
        if (isNaN(Date.parse(birthday))) {
            return res.status(400).json({ message: 'Invalid birthday format. Use YYYY-MM-DD' });
        }

        const newUser = new User({ first_name, last_name, birthday, marital_status, email });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        console.error("Error in POST /api/users:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/users/:id - Update user by ID
router.put('/:id', async (req, res) => {
    try {
        const { first_name, last_name, birthday, marital_status, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { first_name, last_name, birthday, marital_status, email },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/users/:id - Delete a user by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
