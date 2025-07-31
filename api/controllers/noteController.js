// Import models
const Note = require('../models/noteModel');
const Tag = require('../models/tagModel');
const mongoose = require('mongoose');

// Helper for tag validation
const validateTagIds = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return false;
    return tagIds.every(tagId => mongoose.Types.ObjectId.isValid(tagId));
};

// CRUD OPERATIONS FOR NOTES

// Create a new note with tags validation
const createNote = async (req, res) => {
    try {
        const { tags, userId, ...noteData } = req.body;
        
        // Validate tags if provided
        if (tags) {
            if (!validateTagIds(tags)) {
                return res.status(400).send('Invalid tag ID format in tags array');
            }
            
            // Verify tags exist and belong to the user
            if (tags.length > 0) {
                const foundTags = await Tag.find({ _id: { $in: tags }, userId });
                
                if (foundTags.length !== tags.length) {
                    return res.status(400).send('One or more tags not found or do not belong to this user');
                }
            }
        }
        
        // Create note - CHANGE: Use Model.create() instead of new Model().save()
        const savedNote = await Note.create({
            ...noteData,
            userId,
            tags: tags || []
        });
        
        // Get populated note
        const populatedNote = await Note.findById(savedNote._id).populate('tags');
        res.status(201).json(populatedNote);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Get all non-trashed notes
const viewAllNotes = async (req, res) => {
    try {
        // CHANGE: Separate find() and sort() calls
        const notes = await Note.find({ trashed: false }).populate('tags').sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get notes by user with filters
const getNotesByUser = async (req, res) => {
    try {
        const { userId, tagId, done, search } = req.query;
        
        if (!userId) {
            return res.status(400).send('userId is required');
        }
        
        // Build query with filters
        const query = { userId, trashed: false };
        
        if (tagId) {
            if (!mongoose.Types.ObjectId.isValid(tagId)) {
                return res.status(400).send('Invalid tag ID format');
            }
            query.tags = tagId;
        }
        
        if (done !== undefined) {
            query.done = done === 'true';
        }
        
        if (search) {
            // CHANGE: Use RegExp directly as per the requirements
            query.$or = [
                { title: new RegExp(search, "i") },
                { content: new RegExp(search, "i") }
            ];
        }
        
        // CHANGE: Separate find() and sort() calls
        const notes = await Note.find(query).populate('tags').sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get a note by ID
const getNoteById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        const note = await Note.findById(req.params.id).populate('tags');
        
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        res.status(200).json(note);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Update a note with tag validation
const updateNoteById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        const { tags, userId, ...updateData } = req.body;
        
        // Validate tags if provided
        if (tags) {
            if (!validateTagIds(tags)) {
                return res.status(400).send('Invalid tag ID format in tags array');
            }
            
            // Verify tags exist and belong to user
            if (tags.length > 0 && userId) {
                const foundTags = await Tag.find({ _id: { $in: tags }, userId });
                
                if (foundTags.length !== tags.length) {
                    return res.status(400).send('One or more tags not found or do not belong to this user');
                }
            }
            
            updateData.tags = tags;
        }
        
        // CHANGE: Use findByIdAndUpdate as specified
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('tags');
        
        if (!updatedNote) {
            return res.status(404).send('Note not found');
        }
        
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Delete all notes (admin function)
const deleteAllNotes = async (req, res) => {
    try {
        // CHANGE: Use deleteMany as specified
        await Note.deleteMany();
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Permanently delete a note
const deleteNoteById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        // CHANGE: Use findByIdAndDelete as specified
        const deletedNote = await Note.findByIdAndDelete(req.params.id);
        
        if (!deletedNote) {
            return res.status(404).send('Note not found');
        }
        
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// TRASH MANAGEMENT

// Move a note to trash
const moveNoteToTrash = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        // CHANGE: Use findByIdAndUpdate as specified
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            { trashed: true },
            { new: true }
        ).populate('tags');
        
        if (!updatedNote) {
            return res.status(404).send('Note not found');
        }
        
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Restore a note from trash
const restoreNoteFromTrash = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        // CHANGE: Use findByIdAndUpdate as specified
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            { trashed: false },
            { new: true }
        ).populate('tags');
        
        if (!updatedNote) {
            return res.status(404).send('Note not found');
        }
        
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get all trashed notes for a user
const getTrashedNotesByUser = async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).send('userId is required');
        }
        
        // CHANGE: Separate find() and sort() calls
        const notes = await Note.find({ userId, trashed: true }).populate('tags').sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Search in trashed notes
const searchTrashedNotes = async (req, res) => {
    try {
        const { userId, tagId, keyword } = req.query;
        
        if (!userId) {
            return res.status(400).send('userId is required');
        }
        
        const query = { userId, trashed: true };
        
        if (tagId) {
            if (!mongoose.Types.ObjectId.isValid(tagId)) {
                return res.status(400).send('Invalid tag ID format');
            }
            query.tags = tagId;
        }
        
        if (keyword) {
            // CHANGE: Use RegExp directly as per the requirements
            query.$or = [
                { title: new RegExp(keyword, "i") },
                { content: new RegExp(keyword, "i") }
            ];
        }
        
        // CHANGE: Separate find() and sort() calls
        const notes = await Note.find(query).populate('tags').sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// SEARCH AND FILTER FUNCTIONS

// Search notes with filters
const searchNotes = async (req, res) => {
    try {
        const { userId, tagId, keyword } = req.query;
        
        if (!userId) {
            return res.status(400).send('userId is required');
        }
        
        const query = { userId, trashed: false };
        
        if (tagId) {
            if (!mongoose.Types.ObjectId.isValid(tagId)) {
                return res.status(400).send('Invalid tag ID format');
            }
            query.tags = tagId;
        }
        
        if (keyword) {
            // CHANGE: Use RegExp directly as per the requirements
            query.$or = [
                { title: new RegExp(keyword, "i") },
                { content: new RegExp(keyword, "i") }
            ];
        }
        
        // CHANGE: Separate find() and sort() calls
        const notes = await Note.find(query).populate('tags').sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// OTHER FUNCTIONS

// Toggle done status of a note
const toggleNoteDoneById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        // CHANGE: Use findById first, then update
        const note = await Note.findById(req.params.id);
        
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // Use provided value or toggle current status
        const doneValue = req.body.done !== undefined ? req.body.done : !note.done;
        
        // CHANGE: Use findByIdAndUpdate as specified
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            { done: doneValue },
            { new: true }
        ).populate('tags');
        
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Export all controller functions
module.exports = {
    createNote,
    viewAllNotes,
    getNotesByUser,
    getTrashedNotesByUser,
    getNoteById,
    updateNoteById,
    moveNoteToTrash,
    restoreNoteFromTrash,
    deleteAllNotes,
    deleteNoteById,
    searchNotes,
    toggleNoteDoneById,
    searchTrashedNotes
};