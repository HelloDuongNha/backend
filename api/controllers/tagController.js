// Import models
const Tag = require('../models/tagModel');
const Note = require('../models/noteModel');
const mongoose = require('mongoose');   

// Controller functions with async/await and try/catch for error handling
const createTag = async (req, res) => {
    try {
        const { name, color, userId } = req.body;
        
        // Check if name is provided
        if (!name || name.trim() === '') {
            return res.status(400).send('Tag name is required');
        }
        
        // Get userId from req.user (if auth middleware is set up) or from request body
        const userIdentifier = req.user?._id || userId;
        
        // Validate userId
        if (!userIdentifier) {
            return res.status(400).send('userId is required in request body since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // Create new tag with user's ID
        const newTag = new Tag({
            name,
            color: color || '#3498db', // Default blue if not provided
            userId: userIdentifier
        });
        
        const savedTag = await newTag.save();
        res.status(201).json(savedTag);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getAllTags = async (req, res) => {
    try {
        // Get userId from req.user or query parameter
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // Get all tags for the specified user
        const tags = await Tag.find({ userId: userIdentifier }).sort({ name: 1 });
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getTagById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        // Get userId from req.user or query parameter
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // Find tag by ID and ensure it belongs to specified user
        const tag = await Tag.findOne({
            _id: req.params.id,
            userId: userIdentifier
        });
        
        if (!tag) {
            return res.status(404).send('Tag not found or does not belong to you');
        }
        
        res.status(200).json(tag);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateTagById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        const { name, color } = req.body;
        
        // Get userId from req.user or request body
        const userIdentifier = req.user?._id || req.body.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in request body since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // Create update object with only the fields that should be updated
        const updateData = {};
        if (name) updateData.name = name;
        if (color) updateData.color = color;
        
        // Update tag if it belongs to specified user
        const updatedTag = await Tag.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: userIdentifier
            },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedTag) {
            return res.status(404).send('Tag not found or does not belong to you');
        }
        
        res.status(200).json(updatedTag);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteTagById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        // Get userId from req.user or query parameter
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // Delete tag if it belongs to specified user
        const deletedTag = await Tag.findOneAndDelete({
            _id: req.params.id,
            userId: userIdentifier
        });
        
        if (!deletedTag) {
            return res.status(404).send('Tag not found or does not belong to you');
        }
        
        // In a production app, you might also want to:
        // 1. Remove this tag from all notes that reference it
        // await Note.updateMany(
        //     { userId: userIdentifier, tags: req.params.id },
        //     { $pull: { tags: req.params.id } }
        // );
        
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const searchTags = async (req, res) => {
    try {
        const { query } = req.query;
        
        // Get userId from req.user or query parameter
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        if (!query) {
            return res.status(400).send('Search query is required');
        }
        
        // Search tags by name (partial, case-insensitive) for specified user
        const tags = await Tag.find({
            userId: userIdentifier,
            name: { $regex: query, $options: 'i' }
        }).sort({ name: 1 });
        
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getNotesByTagId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        // Get userId from req.user or query parameter
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // First verify the tag belongs to specified user
        const tag = await Tag.findOne({
            _id: req.params.id,
            userId: userIdentifier
        });
        
        if (!tag) {
            return res.status(404).send('Tag not found or does not belong to you');
        }
        
        // Find all notes of specified user that have this tag and are not in trash
        const notes = await Note.find({
            userId: userIdentifier,
            tags: req.params.id,
            trashed: { $ne: true } // Exclude trashed notes
        }).sort({ updatedAt: -1 });
        
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Export controller functions
module.exports = {
    createTag,
    getAllTags,
    getTagById,
    updateTagById,
    deleteTagById,
    searchTags,
    getNotesByTagId
};
