const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    otp: {
        code: {
            type: String
        },
        createdAt: {
            type: Date
        },
        expiresAt: {
            type: Date
        },
        verified: {
            type: Boolean,
            default: false
        }
    },
    emailChangeOtp: {
        code: {
            type: String
        },
        newEmail: {
            type: String
        },
        createdAt: {
            type: Date
        },
        expiresAt: {
            type: Date
        },
        verified: {
            type: Boolean,
            default: false
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
