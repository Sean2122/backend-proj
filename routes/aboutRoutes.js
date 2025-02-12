const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');

// GET /api/about - Retrieve team members (only first_name & last_name)
router.get('/about', async (req, res) => {
    try {
        const teamMembers = await TeamMember.find({}, 'first_name last_name');
        res.json(teamMembers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
