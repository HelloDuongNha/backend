const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    name: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
});

const User = mongoose.model('users', userSchema);
module.exports = User;
