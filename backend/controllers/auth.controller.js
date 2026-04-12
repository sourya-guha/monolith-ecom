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

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    const token = generateToken(user);

    res.status(201).json({
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

    if (!(await canRequestOtp(normalizedEmail))) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
      });
    }

    await recordOtpRequest(normalizedEmail);
    const otp = generateOtp();
    await storeOtp(normalizedEmail, otp);
    await sendOtpEmail(normalizedEmail, otp);

    res.json({ success: true, message: 'OTP sent to your email address. Please enter the code to complete login.' });
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