const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
    description: { type: String, required: true },
    category: { type: String, required: true },
    userid: { type: String, required: true }, // Change to String if it's a string
    sum: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Cost = mongoose.model('Cost', costSchema);

module.exports = Cost;
