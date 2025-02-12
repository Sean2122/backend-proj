const express = require('express');
const router = express.Router();
const Cost = require('../models/Cost');

// Add cost item
router.post('/add', async (req, res) => {
    try {
        const { description, category, userid, sum, createdAt } = req.body;

        // Validate all required fields
        if (!description || !category || !userid || !sum) {
            return res.status(400).json({ message: 'All fields (description, category, userid, and sum) are required' });
        }

        // Use current date for createdAt if not provided
        const newCreatedAt = createdAt || new Date();

        const newCost = new Cost({ description, category, userid, sum, createdAt: newCreatedAt });
        await newCost.save();

        // Respond with the newly added cost item
        res.json(newCost);
    } catch (err) {
        res.status(500).json({ message: 'Error adding cost', error: err.message });
    }
});

module.exports = router;
