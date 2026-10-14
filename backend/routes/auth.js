const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserXP,
  updateUserSettings
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new developer account
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user and return token
router.post('/login', loginUser);

// @route   GET /api/auth/profile
// @desc    Get user profile data
router.get('/profile', protect, getUserProfile);

// @route   POST /api/auth/xp
// @desc    Add XP and assign levels
router.post('/xp', protect, updateUserXP);

// @route   PUT /api/auth/settings
// @desc    Update active model config and notifications
router.put('/settings', protect, updateUserSettings);

module.exports = router;
