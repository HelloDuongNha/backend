const mongoose = require('mongoose');

// Note schema
const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    title: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 150,
    },
    content: {
        type: String,
        required: true,
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tags'
    }],
    done: {
        type: Boolean,
        default: false,
    },
    trashed: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,     // Tự động thêm createdAt và updatedAt
    versionKey: false     // Không tạo trường __v
});

const Note = mongoose.model('notes', noteSchema);
module.exports = Note;
