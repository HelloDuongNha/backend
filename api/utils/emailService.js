const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'duongnnhgch230313@fpt.edu.vn',
        pass: 'zeao eaya bcdt mxgq' // App password for Gmail
    }
});

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send an OTP email for verification
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise} - Email sending result
 */
const sendOTPEmail = async (to, otp) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject: 'Your Verification Code for Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Note-Taking App Verification</h2>
                <p>Your verification code is:</p>
                <h1 style="font-size: 32px; letter-spacing: 5px; background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px;">${otp}</h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Send a welcome email after successful registration
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 * @returns {Promise} - Email sending result
 */
const sendWelcomeEmail = async (to, name) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject: 'Welcome to Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Welcome to Note-Taking App!</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your account has been successfully created for the Note-Taking App.</p>
                <p>You can now log in and start organizing your notes.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Send a login notification email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 * @returns {Promise} - Email sending result
 */
const sendLoginNotificationEmail = async (to, name) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject: 'Login Notification - Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Login Notification</h2>
                <p>Hello ${name || 'there'},</p>
                <p>You have successfully logged in to the Note-Taking App.</p>
                <p>If this wasn't you, please contact our support team immediately.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Send a password reset success email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 * @returns {Promise} - Email sending result
 */
const sendPasswordResetSuccessEmail = async (to, name) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject: 'Password Reset Successful - Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Password Reset Successful</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your password has been successfully reset for the Note-Taking App.</p>
                <p>If you did not request this change, please contact our support team immediately.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Send a profile update confirmation email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 * @returns {Promise} - Email sending result
 */
const sendProfileUpdateEmail = async (to, name) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject: 'Profile Update Notification - Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Profile Updated</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your profile information has been successfully updated for the Note-Taking App.</p>
                <p>If you did not request this change, please contact our support team immediately.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Send email change confirmation emails to both old and new email addresses
 * @param {string} oldEmail - Old email address
 * @param {string} newEmail - New email address
 * @param {string} name - User's name
 * @returns {Promise} - Email sending results
 */
const sendEmailChangeConfirmationEmail = async (oldEmail, newEmail, name) => {
    // Email to old address
    const oldEmailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to: oldEmail,
        subject: 'Email Address Changed - Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Email Address Changed</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your email address for the Note-Taking App has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
                <p>If you did not request this change, please contact our support team immediately.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    // Email to new address
    const newEmailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to: newEmail,
        subject: 'Email Address Confirmed - Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Email Address Confirmed</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your new email address has been successfully confirmed for the Note-Taking App.</p>
                <p>You can now log in using this email address.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    // Send both emails
    await transporter.sendMail(oldEmailOptions);
    return await transporter.sendMail(newEmailOptions);
};

/**
 * Send a generic email with custom content
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @returns {Promise} - Email sending result
 */
const sendGenericEmail = async (to, subject, htmlContent) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject,
        html: htmlContent
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Send account deletion notification email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 * @param {string} adminName - Name of the admin who deleted the account
 * @returns {Promise} - Email sending result
 */
const sendAccountDeletionEmail = async (to, name, adminName) => {
    const mailOptions = {
        from: 'Note-Taking App <duongnnhgch230313@fpt.edu.vn>',
        to,
        subject: 'Your Account Has Been Deleted - Note-Taking App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #8B5CF6;">Account Deleted</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your account for the Note-Taking App has been deleted by administrator <strong>${adminName}</strong>.</p>
                <p>All of your notes, tags, and account information have been removed from our system.</p>
                <p>If you believe this was done in error, please contact our support team.</p>
                <p>Thanks,<br>Note-Taking App Team</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendWelcomeEmail,
    sendLoginNotificationEmail,
    sendPasswordResetSuccessEmail,
    sendProfileUpdateEmail,
    sendEmailChangeConfirmationEmail,
    sendAccountDeletionEmail,
    sendGenericEmail
}; 