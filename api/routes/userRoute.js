// Import controller
const userController = require('../controllers/userController');

// Define all routes for Express app
const userRoute = (app) => {
    // Authentication routes
    app.route('/api/users/register')
        .post(userController.initiateRegister);   // Start registration with email

    app.route('/api/users/verify-register')
        .post(userController.verifyRegisterOTP);  // Verify OTP and complete registration
    
    app.route('/api/users/resend-otp')
        .post(userController.resendRegisterOTP);  // Resend OTP for registration
    
    app.route('/api/users/login')
        .post(userController.loginUser);          // User login
    
    app.route('/api/users/verify-email')
        .post(userController.verifyEmail);        // Verify email with OTP
    
    app.route('/api/users/forgot-password')
        .post(userController.initiateForgotPassword);  // Send OTP for password reset
    
    app.route('/api/users/reset-password')
        .post(userController.resetPasswordWithOTP);    // Reset password with OTP
    
    // Email change process
    app.route('/api/users/initiate-email-change')
        .post(userController.initiateEmailChange); // Send OTP for email change
    
    app.route('/api/users/verify-email-change')
        .post(userController.verifyEmailChange);  // Verify email change with OTP
    
    // Email notifications
    app.route('/api/users/send-notification')
        .post(userController.sendNotificationEmail); // Send notification emails
    
    // User search functionality
    app.route('/api/users/search')
        .get(userController.searchUsers);     // Search users by email or name
    
    // User management (admin)
    app.route('/api/users')
        .get(userController.getAllUsers);     // Get all users (admin only)
    
    // User operations by ID
    app.route('/api/users/:id')
        .get(userController.getUserById)      // Get specific user
        .put(userController.updateUserById)   // Update user info
        .delete(userController.deleteUserById); // Delete user account
    
    // User password management
    app.route('/api/users/:id/password')
        .patch(userController.changePasswordById); // Change password
    
    // User role management
    // app.route('/api/users/:id/role')
    //     .patch(userController.updateUserRoleById); // Change user role
        
    // User analytics
    app.route('/api/users/:id/stats')
        .get(userController.getUserStats); // Get user statistics
};

module.exports = userRoute;
