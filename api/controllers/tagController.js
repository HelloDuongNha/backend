// Import models
const Tag = require('../models/tagModel');
const Note = require('../models/noteModel');
const mongoose = require('mongoose');   

// TAG MANAGEMENT FUNCTIONS

// Create a new tag for a user
const createTag = async (req, res) => {
    try {
        const { name, color, userId } = req.body;
        
        // Validate tag name
        if (!name || name.trim() === '') {
            return res.status(400).send('Tag name is required');
        }
        
        // Get userId from auth middleware or request body
        const userIdentifier = req.user?._id || userId;
        
        // Validate userId
        if (!userIdentifier) {
            return res.status(400).send('userId is required in request body since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // CHANGE: Use Tag.create instead of new Tag and save
        const savedTag = await Tag.create({
            name,
            color: color || '#3498db', // Default blue if not provided
            userId: userIdentifier
        });
        
        res.status(201).json(savedTag);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get all tags for a specific user
const getAllTags = async (req, res) => {
    try {
        // Get userId from auth or query parameter
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // CHANGE: Separate find() and sort() calls
        const tags = await Tag.find({ userId: userIdentifier }).sort({ name: 1 });
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get a specific tag by ID with role-based access control
const getTagById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        // Get userId and role from request
        const userIdentifier = req.user?._id || req.query.userId;
        const requestingUserRole = req.query.userRole; 
        const isAdmin = requestingUserRole === 'admin';
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // CHANGE: Use find() instead of findOne() for consistency
        let tagQuery = isAdmin 
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: userIdentifier };
            
        const tags = await Tag.find(tagQuery);
        
        if (!tags || tags.length === 0) {
            return res.status(404).send('Tag not found or does not belong to you');
        }
        
        res.status(200).json(tags[0]);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Update tag properties by ID
const updateTagById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        const { name, color } = req.body;
        
        // Get userId from auth or request
        const userIdentifier = req.user?._id || req.body.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in request body since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // First find the tag to verify ownership
        const tag = await Tag.findById(req.params.id);
        
        if (!tag) {
            return res.status(404).send('Tag not found');
        }
        
        if (tag.userId.toString() !== userIdentifier.toString()) {
            return res.status(403).send('Tag does not belong to you');
        }
        
        // Only update specified fields
        const updateData = {};
        if (name) updateData.name = name;
        if (color) updateData.color = color;
        
        // CHANGE: Use findByIdAndUpdate as specified
        const updatedTag = await Tag.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.status(200).json(updatedTag);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Delete tag by ID
const deleteTagById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        // Get userId from auth or query
        const userIdentifier = req.user?._id || req.query.userId;
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // CHANGE: First find the tag to verify ownership
        const tag = await Tag.findById(req.params.id);
        
        if (!tag) {
            return res.status(404).send('Tag not found');
        }
        
        if (tag.userId.toString() !== userIdentifier.toString()) {
            return res.status(403).send('Tag does not belong to you');
        }
        
        // CHANGE: Use findByIdAndDelete as specified
        await Tag.findByIdAndDelete(req.params.id);
        
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// SEARCH AND FILTER FUNCTIONS

// Search tags by name
const searchTags = async (req, res) => {
    try {
        const { query } = req.query;
        
        // Get userId from auth or query
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
        
        // CHANGE: Use RegExp directly as per the requirements and separate find() and sort() calls
        const tags = await Tag.find({
            userId: userIdentifier,
            name: new RegExp(query, "i")
        }).sort({ name: 1 });
        
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// RELATIONSHIPS FUNCTIONS

// Get notes associated with a tag
const getNotesByTagId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid tag ID');
        }
        
        // Get userId and role from request
        const userIdentifier = req.user?._id || req.query.userId;
        const requestingUserRole = req.query.userRole;
        const isAdmin = requestingUserRole === 'admin';
        
        if (!userIdentifier) {
            return res.status(400).send('userId is required in query parameter since authentication is not set up');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userIdentifier)) {
            return res.status(400).send('Invalid user ID format');
        }
        
        // CHANGE: Use find() instead of findOne() for consistency
        let tagQuery = isAdmin 
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: userIdentifier };
            
        const tags = await Tag.find(tagQuery);
        
        if (!tags || tags.length === 0) {
            return res.status(404).send('Tag not found or does not belong to you');
        }
        
        const tag = tags[0];
        
        // Use tag's userID for finding notes
        const notesUserId = tag.userId;
        
        // CHANGE: Separate find() and sort() calls
        const notes = await Note.find({
            userId: notesUserId,
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
