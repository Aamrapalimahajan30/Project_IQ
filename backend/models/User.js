const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  levelName: {
    type: String,
    default: 'Project Novice'
  },
  streak: {
    type: Number,
    default: 1
  },
  streakCalendar: {
    type: [String],
    default: []
  },
  aiModel: {
    type: String,
    default: 'gemini-3.5-flash-lite'
  },
  aiTemperature: {
    type: Number,
    default: 0.2
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  xpNotifications: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Pre-save database hook: Automatically hash password before saving user record
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password hashes for login validation
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
