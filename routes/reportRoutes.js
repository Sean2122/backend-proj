const express = require('express');
const router = express.Router();
const Cost = require('../models/Cost'); // Assuming this is your model for costs

// Get Monthly Report
router.get('/report', async (req, res) => {
    try {
        const { id, year, month } = req.query;

        // Handle missing parameters
        let filter = {};

        // If a userid is provided, filter by userid
        if (id) {
            filter.userid = id;
        }

        // If year and month are provided, filter by the specific month and year
        if (year && month && !isNaN(parseInt(month))) {
            const startOfMonth = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00Z`);

            // Correctly calculate the next month
            let nextMonth, nextYear;
            if (month === "12") {
                nextMonth = "01";  // If December, next month is January
                nextYear = parseInt(year) + 1;
            } else {
                nextMonth = String(parseInt(month) + 1).padStart(2, '0');  // Increment month
                nextYear = year;
            }

            const startOfNextMonth = new Date(`${nextYear}-${nextMonth}-01T00:00:00Z`);

            filter.createdAt = {
                $gte: startOfMonth,  // Start of selected month
                $lt: startOfNextMonth // Start of next month
            };
        }

        // If only year is provided, filter by that year
        else if (year) {
            filter.createdAt = {
                $gte: new Date(`${year}-01-01T00:00:00Z`), // Start of the year
                $lt: new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`) // Start of the next year
            };
        }

        // Fetch cost items based on filter
        const costs = await Cost.find(filter);

        // Group by category
        const groupedCosts = costs.reduce((acc, cost) => {
            const day = new Date(cost.createdAt).getDate();
            const category = cost.category;

            // If the category doesn't exist in the accumulator, initialize it
            if (!acc[category]) {
                acc[category] = [];
            }

            // Add cost item with day, description, and sum
            acc[category].push({
                sum: cost.sum,
                description: cost.description,
                day: day
            });

            return acc;
        }, {});

        // Prepare the response object
        const report = {
            userid: id || 'All users',  // Show 'All users' if no user id is provided
            year: year || 'All time',   // Show 'All time' if no year is provided
            month: month || 'All months', // Show 'All months' if no month is provided
            costs: [
                { food: groupedCosts.food || [] },
                { education: groupedCosts.education || [] },
                { health: groupedCosts.health || [] },
                { housing: groupedCosts.housing || [] },
                { sport: groupedCosts.sport || [] }
            ]
        };

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching report', error: err.message });
    }
});

module.exports = router;
