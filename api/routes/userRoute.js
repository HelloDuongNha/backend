// 1. import controller
const userController = require('../controllers/userController');

// 2. declare endpoints with API methods & controller functions
const userRoute = (app) => {
    // Auth routes
    app.route('/api/users/register')
        .post(userController.registerUser);   // register a new user
    
    app.route('/api/users/login')
        .post(userController.loginUser);      // login user
    
    // Search route
    app.route('/api/users/search')
        .get(userController.searchUsers);     // search users by email or name
    
    // Users list route
    app.route('/api/users')
        .get(userController.getAllUsers);     // get all users (for admin)
    
    // User by ID routes
    app.route('/api/users/:id')
        .get(userController.getUserById)      // get user by ID
        .put(userController.updateUserById)   // update user by ID
        .delete(userController.deleteUserById); // delete user by ID
    
    // Password change route
    app.route('/api/users/:id/password')
        .patch(userController.changePasswordById); // change user password
    
    // Role update route
    app.route('/api/users/:id/role')
        .patch(userController.updateUserRoleById); // change user role
};

// 3. export the route to use in other files
module.exports = userRoute;
