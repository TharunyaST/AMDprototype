const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String },
    avatar: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('User', userSchema);
