const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// 1. import controller
const noteRoute = (app) => {
    // Base API routes for notes
    app.route('/api/notes')
        .get(noteController.viewAllNotes)   // get all notes
        .post(noteController.createNote)    // create a new note
        .delete(noteController.deleteAllNotes); // delete all notes

    // Route for getting notes by user
    app.route('/api/notes/user')
        .get(noteController.getNotesByUser); // get all notes for a user with optional filters

    // Route for getting trashed notes by user
    app.route('/api/notes/trash')
        .get(noteController.getTrashedNotesByUser); // get all trashed notes for a user
        
    // Route for searching trashed notes
    app.route('/api/notes/trash/search')
        .get(noteController.searchTrashedNotes); // search trashed notes for a user

    // Search route for notes
    app.route('/api/notes/search')
        .get(noteController.searchNotes);    // search/filter notes

    // API routes for a specific note by ID
    app.route('/api/notes/:id')
        .get(noteController.getNoteById)     // get a note by ID
        .put(noteController.updateNoteById)  // update a note by ID
        .delete(noteController.deleteNoteById);  // delete a note by ID
    
    // Trash operations routes
    app.route('/api/notes/:id/trash')
        .put(noteController.moveNoteToTrash); // move note to trash
    
    app.route('/api/notes/:id/restore')
        .put(noteController.restoreNoteFromTrash); // restore note from trash
    
    // Toggle done status route
    app.route('/api/notes/:id/done')
        .patch(noteController.toggleNoteDoneById); // toggle or set the done status
}

// 3. export the route to use in other files
module.exports = noteRoute;