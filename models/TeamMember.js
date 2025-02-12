const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true }
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema, 'team_members');
