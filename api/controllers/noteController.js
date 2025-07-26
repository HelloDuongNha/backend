// Import model
const Note = require('../models/noteModel');
const Tag = require('../models/tagModel');
const mongoose = require('mongoose');

// Validate tag IDs
const validateTagIds = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return false;
    
    return tagIds.every(tagId => mongoose.Types.ObjectId.isValid(tagId));
};

// Controller functions with async/await and try/catch for error handling
const createNote = async (req, res) => {
    try {
        const { tags, userId, ...noteData } = req.body;
        
        // Validate tags if provided
        if (tags) {
            if (!validateTagIds(tags)) {
                return res.status(400).send('Invalid tag ID format in tags array');
            }
            
            // Verify all tags exist and belong to the user
            if (tags.length > 0) {
                const foundTags = await Tag.find({
                    _id: { $in: tags },
                    userId
                });
                
                if (foundTags.length !== tags.length) {
                    return res.status(400).send('One or more tags not found or do not belong to this user');
                }
            }
        }
        
        // Create note with validated data
        const newNote = new Note({
            ...noteData,
            userId,
            tags: tags || []
        });
        
        const savedNote = await newNote.save();
        
        // Populate tags in the response
        const populatedNote = await Note.findById(savedNote._id).populate('tags');
        res.status(201).json(populatedNote);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const viewAllNotes = async (req, res) => {
    try {
        const notes = await Note.find({ trashed: false })
            .populate('tags')
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getNotesByUser = async (req, res) => {
    try {
        const { userId, tagId, done, search } = req.query;
        
        if (!userId) {
            return res.status(400).send('userId is required');
        }
        
        // Base query
        const query = { userId, trashed: false };
        
        // Add optional filters if provided
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
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        const notes = await Note.find(query)
            .populate('tags')
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getTrashedNotesByUser = async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).send('userId is required');
        }
        
        const notes = await Note.find({ userId, trashed: true })
            .populate('tags')
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

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

const updateNoteById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        const { tags, userId, ...updateData } = req.body;
        
        // If tags are provided, validate them
        if (tags) {
            if (!validateTagIds(tags)) {
                return res.status(400).send('Invalid tag ID format in tags array');
            }
            
            // Verify all tags exist and belong to the user
            if (tags.length > 0 && userId) {
                const foundTags = await Tag.find({
                    _id: { $in: tags },
                    userId
                });
                
                if (foundTags.length !== tags.length) {
                    return res.status(400).send('One or more tags not found or do not belong to this user');
                }
            }
            
            updateData.tags = tags;
        }
        
        // Update note with validated data
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('tags');
        
        if (!updatedNote) {
            return res.status(404).send('Note not found');
        }
        
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const moveNoteToTrash = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
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

const restoreNoteFromTrash = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
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

const deleteAllNotes = async (req, res) => {
    try {
        await Note.deleteMany();
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteNoteById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        const deletedNote = await Note.findByIdAndDelete(req.params.id);
        
        if (!deletedNote) {
            return res.status(404).send('Note not found');
        }
        
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

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
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { content: { $regex: keyword, $options: 'i' } }
            ];
        }
        
        const notes = await Note.find(query)
            .populate('tags')
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const toggleNoteDoneById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid note ID');
        }
        
        const note = await Note.findById(req.params.id);
        
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // If done status is provided in body, use it; otherwise toggle the current value
        const doneValue = req.body.done !== undefined ? req.body.done : !note.done;
        
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
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { content: { $regex: keyword, $options: 'i' } }
            ];
        }
        
        const notes = await Note.find(query)
            .populate('tags')
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Export controller functions
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