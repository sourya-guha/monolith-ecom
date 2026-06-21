const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../utils/email');
const {
  generateOtp,
  canRequestOtp,
  recordOtpRequest,
  storeOtp,
  verifyOtp,
  hasTooManyOtpFailures,
} = require('../utils/otp');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (user && user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Generate and send OTP for email verification first
    if (!(await canRequestOtp(normalizedEmail))) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
      });
    }

    await recordOtpRequest(normalizedEmail);
    const otp = generateOtp();
    await storeOtp(normalizedEmail, otp);
    
    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (emailErr) {
      console.error('[auth] email sending failed:', emailErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please check server SMTP settings.' });
    }

    // Only create/update the user in the DB AFTER the email successfully sends
    if (user && !user.isVerified) {
      user.name = name.trim();
      user.password = password; // Will be re-hashed by pre-save hook
      user.role = role;
      await user.save();
    } else {
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        isVerified: false
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created! OTP sent to your email. Please verify to complete registration.',
    });
  } catch (err) {
    console.error('[auth] register error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Unable to register user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }



    // Login succeeds — return token directly, no OTP
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await hasTooManyOtpFailures(normalizedEmail)) {
      return res.status(429).json({
        success: false,
        message: 'Too many invalid OTP attempts. Please try again later.',
      });
    }

    const valid = await verifyOtp(normalizedEmail, otp);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('[auth] verifyOtp error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'OTP verification failed' });
  }
};