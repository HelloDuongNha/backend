// Import models and dependencies
const User = require('../models/userModel');
const Note = require('../models/noteModel');
const Tag = require('../models/tagModel');
const mongoose = require('mongoose');
const emailService = require('../utils/emailService');

// AUTHENTICATION FUNCTIONS

// Step 1: Start registration process
const initiateRegister = async (req, res) => {
    try {
        const { email, name } = req.body;
        
        // Validate input
        if (!email) {
            return res.status(400).send('Email is required');
        }
        
        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isEmailVerified) {
            return res.status(409).send('User with this email already exists');
        }
        
        // Generate OTP
        const otp = emailService.generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        
        // Update existing unverified user
        if (existingUser) {
            existingUser.otp = {
                code: otp,
                expiresAt: otpExpiry,
                verified: false
            };
            await existingUser.save();
            
            await emailService.sendOTPEmail(email, otp);
            
            return res.status(200).json({
                message: 'OTP sent to your email for verification',
                userId: existingUser._id,
                isNewUser: false
            });
        }
        
        // Create new unverified user
        const newUser = new User({
            email,
            name: name || email.split('@')[0], // Default name from email
            passwordHash: 'TEMPORARY_' + otp, // Temporary password
            otp: {
                code: otp,
                expiresAt: otpExpiry,
                verified: false
            },
            isEmailVerified: false
        });
        
        const savedUser = await newUser.save();
        
        await emailService.sendOTPEmail(email, otp);
        
        res.status(201).json({
            message: 'OTP sent to your email for verification',
            userId: savedUser._id,
            isNewUser: true
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Step 2: Verify OTP and complete registration
const verifyRegisterOTP = async (req, res) => {
    try {
        const { userId, otp, password, name } = req.body;
        
        // Validate input
        if (!userId || !otp || !password) {
            return res.status(400).send('User ID, OTP, and password are required');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid user ID');
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Validate OTP
        if (!user.otp || !user.otp.code || user.otp.code !== otp) {
            return res.status(400).send('Invalid OTP');
        }
        
        if (user.otp.expiresAt < new Date()) {
            return res.status(400).send('OTP has expired');
        }
        
        // Update user
        user.passwordHash = password; // Should be hashed in production
        if (name) user.name = name;
        user.isEmailVerified = true;
        user.otp.verified = true;
        
        await user.save();
        
        await emailService.sendWelcomeEmail(user.email, user.name);
        
        res.status(200).json({
            message: 'Registration completed successfully',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Resend OTP for registration verification
const resendRegisterOTP = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Validate input
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Valid user ID is required');
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Generate new OTP
        const otp = emailService.generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        
        user.otp = {
            code: otp,
            expiresAt: otpExpiry,
            verified: false
        };
        
        await user.save();
        
        await emailService.sendOTPEmail(user.email, otp);
        
        res.status(200).json({
            message: 'New OTP sent to your email',
            userId: user._id
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// User login with email notification
const loginUser = async (req, res) => {
    try {
        const { email, passwordHash } = req.body;
        
        // Validate input
        if (!email || !passwordHash) {
            return res.status(400).send('Email and password are required');
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }
        
        // Handle unverified email
        if (!user.isEmailVerified) {
            // Generate new verification OTP
            const otp = emailService.generateOTP();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            
            user.otp = {
                code: otp,
                expiresAt: otpExpiry,
                verified: false
            };
            
            await user.save();
            
            await emailService.sendOTPEmail(user.email, otp);
            
            return res.status(403).json({
                message: 'Email not verified. OTP sent for verification.',
                userId: user._id,
                requiresVerification: true
            });
        }
        
        // Validate password
        if (user.passwordHash !== passwordHash) {
            return res.status(401).send('Invalid email or password');
        }
        
        // Send login notification
        await emailService.sendLoginNotificationEmail(user.email, user.name);
        
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// PASSWORD MANAGEMENT

// Initiate password reset process
const initiateForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).send('Email is required');
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('No account found with this email');
        }
        
        // Generate OTP
        const otp = emailService.generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        
        user.otp = {
            code: otp,
            expiresAt: otpExpiry,
            verified: false
        };
        
        await user.save();
        
        await emailService.sendOTPEmail(user.email, otp);
        
        res.status(200).json({
            message: 'OTP sent to your email for password reset',
            userId: user._id
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Reset password with OTP verification
const resetPasswordWithOTP = async (req, res) => {
    try {
        const { userId, otp, newPassword } = req.body;
        
        // Validate input
        if (!userId || !otp || !newPassword) {
            return res.status(400).send('User ID, OTP, and new password are required');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid user ID');
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Validate OTP
        if (!user.otp || !user.otp.code || user.otp.code !== otp) {
            return res.status(400).send('Invalid OTP');
        }
        
        if (user.otp.expiresAt < new Date()) {
            return res.status(400).send('OTP has expired');
        }
        
        // Update password
        user.passwordHash = newPassword; // Should be hashed in production
        user.otp.verified = true;
        
        await user.save();
        
        await emailService.sendPasswordResetSuccessEmail(user.email, user.name);
        
        res.status(200).json({
            message: 'Password reset successful',
            email: user.email
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Change password for logged-in user
const changePasswordById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).send('Current password and new password are required');
        }
        
        if (newPassword.length < 6) {
            return res.status(400).send('Password must be at least 6 characters');
        }
        
        // Find user
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Verify current password
        if (user.passwordHash !== currentPassword) {
            return res.status(401).send('Current password is incorrect');
        }
        
        // Update password
        user.passwordHash = newPassword; // Should be hashed in production
        await user.save();
        
        // Send notification
        await emailService.sendPasswordResetSuccessEmail(user.email, user.name);
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// USER MANAGEMENT FUNCTIONS

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash -otp');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const user = await User.findById(req.params.id).select('-passwordHash -otp');
        
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Update user information
const updateUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const { email, name, password } = req.body;
        
        // Find user
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Get admin info for notifications
        const adminName = req.query.adminName || 'Administrator';
        const oldEmail = user.email;
        const oldName = user.name;
        
        // Create update object
        const updateData = {};
        let changeDescription = "Account updated";
        
        // Update name if provided
        if (name && name !== user.name) {
            updateData.name = name;
            changeDescription = `Name changed from "${oldName}" to "${name}"`;
        }
        
        // Update email if provided
        if (email && email !== user.email) {
            // Check if email is already used
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(409).send('Email already in use by another account');
            }
            updateData.email = email;
            changeDescription = `Email changed from "${oldEmail}" to "${email}"`;
        }
        
        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).send('Password must be at least 6 characters');
            }
            updateData.passwordHash = password; // Should be hashed in production
            changeDescription = "Password was reset";
        }
        
        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
            return res.status(400).send('No valid fields to update');
        }
        
        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-passwordHash -otp');
        
        // Send notification emails
        try {
            const emailSubject = "Your Account Was Updated";
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #8B5CF6;">Account Update Notification</h2>
                    <p>Hello ${updatedUser.name || 'there'},</p>
                    <p>${changeDescription} by administrator <strong>${adminName}</strong>.</p>
                    <p>If you did not expect this change, please contact our support team immediately.</p>
                    <p>Thanks,<br>Note-Taking App Team</p>
                </div>
            `;
            
            // Send to both emails if email was changed
            if (email && email !== oldEmail) {
                await emailService.sendGenericEmail(oldEmail, emailSubject, emailHtml);
                await emailService.sendGenericEmail(email, emailSubject, emailHtml);
            } else {
                await emailService.sendGenericEmail(updatedUser.email, emailSubject, emailHtml);
            }
            
        } catch (emailError) {
            console.error('Failed to send notification emails:', emailError);
            // Continue as main operation succeeded
        }
        
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).send('Email already in use');
        }
        res.status(500).send(error.message);
    }
};

// Delete user and optionally their data
const deleteUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }

        // Find user
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        const userEmail = user.email;
        const userName = user.name;
        
        // Check for cascade delete option
        const cascade = req.query.cascade === 'true';
        const adminName = req.query.adminName || 'Administrator';
        
        if (cascade) {
            // Delete user's notes and tags
            await Note.deleteMany({ userId: req.params.id });
            await Tag.deleteMany({ userId: req.params.id });
        }
        
        // Delete user
        await User.findByIdAndDelete(req.params.id);
        
        // Send notification email
        try {
            await emailService.sendAccountDeletionEmail(userEmail, userName, adminName);
        } catch (emailError) {
            console.error('Failed to send account deletion email:', emailError);
            // Continue as main operation succeeded
        }
        
        res.status(200).json({
            message: 'User and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send(error.message);
    }
};

// EMAIL MANAGEMENT FUNCTIONS

// Initiate email change
const initiateEmailChange = async (req, res) => {
    try {
        const { userId, newEmail } = req.body;

        // Validate input
        if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !newEmail) {
            return res.status(400).send('User ID and new email are required');
        }

        // Check if email is already used
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(409).send('This email is already in use by another account');
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Generate OTP
        const otp = emailService.generateOTP();
        
        // Store OTP for email change
        user.emailChangeOtp = {
            code: otp,
            newEmail: newEmail,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60000), // 5 minutes
            verified: false
        };

        await user.save();

        // Send OTP to new email
        await emailService.sendOTPEmail(newEmail, otp);

        res.status(200).json({
            message: 'Verification code has been sent to your new email address'
        });
    } catch (error) {
        console.error('Error initiating email change:', error);
        res.status(500).send(error.message);
    }
};

// Verify email change with OTP
const verifyEmailChange = async (req, res) => {
    try {
        const { userId, otp, newEmail } = req.body;

        // Validate input
        if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !otp || !newEmail) {
            return res.status(400).send('User ID, OTP, and new email are required');
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Validate OTP
        if (!user.emailChangeOtp || user.emailChangeOtp.code !== otp || user.emailChangeOtp.newEmail !== newEmail) {
            return res.status(401).send('Invalid verification code');
        }

        if (user.emailChangeOtp.expiresAt < new Date()) {
            return res.status(401).send('Verification code has expired');
        }

        // Update email
        const oldEmail = user.email;
        user.email = newEmail;
        user.emailChangeOtp.verified = true;

        await user.save();

        // Send confirmation emails
        await emailService.sendEmailChangeConfirmationEmail(oldEmail, newEmail, user.name);
        
        res.status(200).json({
            message: 'Email has been updated successfully'
        });
    } catch (error) {
        console.error('Error verifying email change:', error);
        res.status(500).send(error.message);
    }
};

// Verify email with OTP
const verifyEmail = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        
        // Validate input
        if (!userId || !otp) {
            return res.status(400).send('User ID and OTP are required');
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid user ID');
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Validate OTP
        if (!user.otp || !user.otp.code || user.otp.code !== otp) {
            return res.status(400).send('Invalid OTP');
        }
        
        if (user.otp.expiresAt < new Date()) {
            return res.status(400).send('OTP has expired');
        }
        
        // Mark email as verified
        user.isEmailVerified = true;
        user.otp.verified = true;
        
        await user.save();
        
        res.status(200).json({
            message: 'Email verified successfully',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Send notification emails
const sendNotificationEmail = async (req, res) => {
    try {
        const { type, email, name } = req.body;

        // Validate input
        if (!type || !email) {
            return res.status(400).send('Notification type and email are required');
        }

        let success = false;
        
        switch (type) {
            case 'password':
                await emailService.sendPasswordResetSuccessEmail(email, name);
                success = true;
                break;
            case 'email':
                // Email changes handled in verifyEmailChange
                success = true;
                break;
            case 'name':
                await emailService.sendProfileUpdateEmail(email, name);
                success = true;
                break;
            default:
                return res.status(400).send('Invalid notification type');
        }

        if (success) {
            res.status(200).json({ message: 'Notification email sent successfully' });
        } else {
            throw new Error('Failed to send notification email');
        }
    } catch (error) {
        console.error('Error sending notification email:', error);
        res.status(500).send(error.message);
    }
};

// SEARCH AND DATA ACCESS FUNCTIONS

// Search users by keyword
const searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        
        if (!keyword) {
            return res.status(400).send('Search keyword is required');
        }
        
        // Search by email or name
        const users = await User.find({
            $or: [
                { email: { $regex: keyword, $options: 'i' } },
                { name: { $regex: keyword, $options: 'i' } }
            ]
        }).select('-passwordHash -otp');
        
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const userId = req.params.id;
        
        // Find user
        const user = await User.findById(userId).select('-passwordHash -otp');
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Get user stats
        const notesCount = await Note.countDocuments({ userId, trashed: { $ne: true } });
        const tagsCount = await Tag.countDocuments({ userId });
        
        // Get user data
        const notes = await Note.find({ userId, trashed: { $ne: true } }).populate('tags');
        const tags = await Tag.find({ userId });
        
        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            stats: {
                notesCount,
                tagsCount
            },
            notes,
            tags
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).send(error.message);
    }
};

// Export controller functions
module.exports = {
    initiateRegister,
    verifyRegisterOTP,
    resendRegisterOTP,
    loginUser,
    initiateForgotPassword,
    resetPasswordWithOTP,
    verifyEmail,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    changePasswordById,
    searchUsers,
    initiateEmailChange,
    verifyEmailChange,
    sendNotificationEmail,
    getUserStats
};
