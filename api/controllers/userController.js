// Import model
const User = require('../models/userModel');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Create a transporter object for sending emails via Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'duongnnhgch230313@fpt.edu.vn',
        pass: 'zeao eaya bcdt mxgq'
    }
});

// Helper function to generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP via email
const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: 'duongnnhgch230313@fpt.edu.vn',
        to: email,
        subject: 'Your One-Time Password (OTP)',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Your One-Time Password</h2>
                <p>Please use the following OTP to complete your request:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h1 style="font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This OTP will expire in 5 minutes.</p>
                <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

// Controller functions with async/await and try/catch for error handling
const registerUser = async (req, res) => {
    try {
        const { email, passwordHash, role, name } = req.body;
        
        // Check if required fields are provided
        if (!email || !passwordHash) {
            return res.status(400).send('Email and password are required');
        }
        
        // Check if user with same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).send('User with this email already exists');
        }
        
        // Create new user
        const newUser = new User({
            email,
            passwordHash,
            role: role || 'user', // Default to 'user' if not provided
            name: name || 'guest'
        });
        
        const savedUser = await newUser.save();
        
        // Don't return passwordHash in response
        const userResponse = {
            _id: savedUser._id,
            email: savedUser.email,
            role: savedUser.role,
            name: savedUser.name,
            createdAt: savedUser.createdAt
        };
        
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, passwordHash } = req.body;
        
        // Validate input
        if (!email || !passwordHash) {
            return res.status(400).send('Email and password are required');
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }
        
        // Check password
        // Note: In a real app, you'd use bcrypt.compare() or similar
        if (user.passwordHash !== passwordHash) {
            return res.status(401).send('Invalid email or password');
        }
        
        // In a real app, generate JWT token here
        // const token = generateToken(user._id, user.role);
        
        // Return success response (would include token in a real app)
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
            // token: token
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getAllUsers = async (req, res) => {
    try {
        // In a real app, you might want to check if requestor is admin
        
        // Get all users, excluding passwordHash
        const users = await User.find().select('-passwordHash');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        // Find user by ID, excluding passwordHash
        const user = await User.findById(req.params.id).select('-passwordHash');
        
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const { email, name, role } = req.body;
        
        // Create update object with only the fields that should be updated
        const updateData = {};
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (role && ['user', 'admin'].includes(role)) updateData.role = role;
        
        // Update user and return updated document
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-passwordHash');
        
        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        
        res.status(200).json(updatedUser);
    } catch (error) {
        // Handle duplicate key error (e.g., email already exists)
        if (error.code === 11000) {
            return res.status(409).send('Email already in use');
        }
        res.status(500).send(error.message);
    }
};

const deleteUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        
        if (!deletedUser) {
            return res.status(404).send('User not found');
        }
        
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

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
        // Note: In a real app, you'd use bcrypt.compare()
        if (user.passwordHash !== currentPassword) {
            return res.status(401).send('Current password is incorrect');
        }
        
        // Update password
        // Note: In a real app, you'd hash the password with bcrypt
        user.passwordHash = newPassword;
        await user.save();
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateUserRoleById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid user ID');
        }
        
        const { role } = req.body;
        
        // Validate role
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).send('Valid role (user or admin) is required');
        }
        
        // Update user role
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-passwordHash');
        
        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        
        if (!keyword) {
            return res.status(400).send('Search keyword is required');
        }
        
        // Search users by email or name
        const users = await User.find({
            $or: [
                { email: { $regex: keyword, $options: 'i' } },
                { name: { $regex: keyword, $options: 'i' } }
            ]
        }).select('-passwordHash');
        
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Send OTP for user verification
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Generate a random 6-digit OTP
        const otp = generateOTP();
        
        // Calculate expiry time (5 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        
        // For forgot password, verify user exists before sending OTP
        let user = await User.findOne({ email });
        
        // For registration flow, we might want to handle differently
        const isRegistrationFlow = req.query.flow === 'registration';
        
        if (!user && !isRegistrationFlow) {
            return res.status(404).json({ 
                success: false, 
                message: 'No user found with this email' 
            });
        }
        
        if (!user && isRegistrationFlow) {
            // For registration, create a temporary user with just email and OTP
            user = new User({
                email,
                passwordHash: '', // Will be set during registration completion
                otp: {
                    code: otp,
                    expiresAt
                }
            });
            await user.save();
        } else {
            // Update existing user with new OTP
            user.otp = {
                code: otp,
                expiresAt
            };
            await user.save();
        }
        
        // Send OTP via email
        await sendOtpEmail(email, otp);
        
        res.status(200).json({ 
            success: true, 
            message: 'OTP sent successfully',
            expiresAt
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please try again.' 
        });
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and OTP are required' 
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'No user found with this email' 
            });
        }
        
        // Check if OTP exists and is valid
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({ 
                success: false, 
                message: 'No OTP has been generated for this email' 
            });
        }
        
        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }
        
        // Check if OTP matches
        if (user.otp.code !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }
        
        // OTP is valid - you can clear it after use if needed
        // user.otp = undefined;
        // await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'OTP verified successfully',
            userId: user._id
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify OTP. Please try again.' 
        });
    }
};

// Reset password using OTP
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, OTP and new password are required' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'No user found with this email' 
            });
        }
        
        // Check if OTP exists and is valid
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({ 
                success: false, 
                message: 'No OTP has been generated for this email' 
            });
        }
        
        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }
        
        // Check if OTP matches
        if (user.otp.code !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }
        
        // Update password and clear OTP
        user.passwordHash = newPassword;
        user.otp = undefined;
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Password reset successfully' 
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reset password. Please try again.' 
        });
    }
};

// Complete registration with OTP
const completeRegistration = async (req, res) => {
    try {
        const { email, otp, name, password } = req.body;
        
        if (!email || !otp || !name || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, OTP, name and password are required' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'No registration in progress for this email' 
            });
        }
        
        // Check if OTP exists and is valid
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({ 
                success: false, 
                message: 'No OTP has been generated for this email' 
            });
        }
        
        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }
        
        // Check if OTP matches
        if (user.otp.code !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }
        
        // Complete registration
        user.name = name;
        user.passwordHash = password;
        user.otp = undefined; // Clear OTP after use
        await user.save();
        
        // Don't return passwordHash in response
        const userResponse = {
            _id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
            createdAt: user.createdAt
        };
        
        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error completing registration:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to complete registration. Please try again.' 
        });
    }
};

// Export controller functions
module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    changePasswordById,
    updateUserRoleById,
    searchUsers,
    sendOtp,
    verifyOtp,
    resetPassword,
    completeRegistration
};
