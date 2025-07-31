// 1. import controller
const tagController = require('../controllers/tagController');

// 2. declare endpoints with API methods & controller functions
const tagRoute = (app) => {
    // Basic tag operations
    app.route('/api/tags')
        .post(tagController.createTag)    // Create a new tag
        .get(tagController.getAllTags);   // Get all tags for current user
    
    // Search functionality
    app.route('/api/tags/search')
        .get(tagController.searchTags);   // Search tags by name
    
    // Individual tag operations by ID
    app.route('/api/tags/:id')
        .get(tagController.getTagById)       // Get tag by ID
        .put(tagController.updateTagById)    // Update tag by ID
        .delete(tagController.deleteTagById); // Delete tag by ID
    
    // Tag relationship operations
    app.route('/api/tags/:id/notes')
        .get(tagController.getNotesByTagId); // Get notes with this tag
};

// 3. export the route to use in other files
module.exports = tagRoute;
