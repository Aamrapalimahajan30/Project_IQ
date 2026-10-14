const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { awardXP } = require('../utils/xpService');

// Function 1: Creates a secure login token (JWT) using the user ID
// Valid for 30 days so the user stays logged in
const generateToken = (id) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing or empty.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Function 2: Registers a new user account
// Saves user details, initializes study streak, and gives them a login token
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Check if an account already exists with this email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Create the user in MongoDB
    const user = await User.create({
      name,
      email,
      password,
      streakCalendar: [todayStr]
    });

    // Send back the user data and login token
    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName,
        streak: user.streak,
        streakCalendar: user.streakCalendar,
        aiModel: user.aiModel,
        aiTemperature: user.aiTemperature,
        emailNotifications: user.emailNotifications,
        xpNotifications: user.xpNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Function 3: Logs in an existing user
// Validates password, updates consecutive daily study streak, and returns login token
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // Manage Streak updates upon login check
      const todayStr = new Date().toISOString().split('T')[0];
      let updatedStreak = user.streak;
      let calendar = [...user.streakCalendar];

      if (!calendar.includes(todayStr)) {
        calendar.push(todayStr);
        
        // Calculate diff between last login date
        if (calendar.length > 1) {
          const lastDate = new Date(calendar[calendar.length - 2]);
          const diffTime = Math.abs(new Date(todayStr) - lastDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            updatedStreak += 1;
          } else if (diffDays > 1) {
            updatedStreak = 1; // Reset streak
          }
        }
        
        user.streak = updatedStreak;
        user.streakCalendar = calendar;
        await user.save();
      }

      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          xp: user.xp,
          level: user.level,
          levelName: user.levelName,
          streak: user.streak,
          streakCalendar: user.streakCalendar,
          aiModel: user.aiModel,
          aiTemperature: user.aiTemperature,
          emailNotifications: user.emailNotifications,
          xpNotifications: user.xpNotifications
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
};

// Function 4: Fetches the logged-in user's profile, XP, streak, and preferences
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName,
        streak: user.streak,
        streakCalendar: user.streakCalendar,
        aiModel: user.aiModel,
        aiTemperature: user.aiTemperature,
        emailNotifications: user.emailNotifications,
        xpNotifications: user.xpNotifications
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Function 5: Awards XP points and levels up the user when they complete learning tasks
const updateUserXP = async (req, res, next) => {
  const { amount, source } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await awardXP(user, amount, source);

    res.json({
      xp: user.xp,
      level: user.level,
      levelName: user.levelName
    });
  } catch (error) {
    next(error);
  }
};

// Function 6: Saves user preferences (like AI model choice or notifications)
const updateUserSettings = async (req, res, next) => {
  const { aiModel, aiTemperature, emailNotifications, xpNotifications } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (aiModel !== undefined) user.aiModel = aiModel;
    if (aiTemperature !== undefined) user.aiTemperature = aiTemperature;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (xpNotifications !== undefined) user.xpNotifications = xpNotifications;

    await user.save();

    res.json({
      message: 'Settings updated successfully',
      settings: {
        aiModel: user.aiModel,
        aiTemperature: user.aiTemperature,
        emailNotifications: user.emailNotifications,
        xpNotifications: user.xpNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserXP,
  updateUserSettings,
  generateToken
};
