// Import model
const User = require('../models/userModel');
const mongoose = require('mongoose');

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
    searchUsers
};
