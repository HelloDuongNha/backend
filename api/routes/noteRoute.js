const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// Define note routes for Express app
const noteRoute = (app) => {
    // Basic CRUD operations
    app.route('/api/notes')
        .get(noteController.viewAllNotes)   // Get all notes
        .post(noteController.createNote)     // Create a new note
        .delete(noteController.deleteAllNotes); // Delete all notes (admin function)

    // User-specific note routes
    app.route('/api/notes/user')
        .get(noteController.getNotesByUser); // Get user notes with optional filters

    // Trash management routes
    app.route('/api/notes/trash')
        .get(noteController.getTrashedNotesByUser); // Get user's trashed notes
        
    app.route('/api/notes/trash/search')
        .get(noteController.searchTrashedNotes); // Search in trashed notes

    // Search functionality
    app.route('/api/notes/search')
        .get(noteController.searchNotes);    // Search/filter notes

    // Individual note operations by ID
    app.route('/api/notes/:id')
        .get(noteController.getNoteById)     // Get a note by ID
        .put(noteController.updateNoteById)  // Update a note by ID
        .delete(noteController.deleteNoteById);  // Delete a note permanently
    
    // Trash operations
    app.route('/api/notes/:id/trash')
        .put(noteController.moveNoteToTrash); // Move note to trash
    
    app.route('/api/notes/:id/restore')
        .put(noteController.restoreNoteFromTrash); // Restore note from trash
    
    // Task management
    app.route('/api/notes/:id/done')
        .patch(noteController.toggleNoteDoneById); // Toggle note's done status
}

module.exports = noteRoute;