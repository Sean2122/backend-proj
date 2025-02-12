const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware to parse JSON (important)
app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/users', require('./routes/userRoutes')); // Users route
app.use('/api', require('./routes/costRoutes')); // Costs route (with /add)
app.use('/api', require('./routes/reportRoutes')); // Report route
app.use('/api', require('./routes/aboutRoutes')); // About route (Team Members)

module.exports = app;
