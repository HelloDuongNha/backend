const mongoose = require('mongoose');

// Tag schema
const tagSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    color: {
        type: String,
        default: '#3498db', // Default blue color
    }
}, {
    timestamps: true,
    versionKey: false
});

const Tag = mongoose.model('tags', tagSchema);
module.exports = Tag;
