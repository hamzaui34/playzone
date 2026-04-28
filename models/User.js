import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  avatar: {
    type: String,
    default: '/default-avatar.png',
  },
  coins: {
    type: Number,
    default: 100,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  loginStreak: {
    type: Number,
    default: 0,
  },
  totalGamesPlayed: {
    type: Number,
    default: 0,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  achievements: [{
    id: String,
    title: String,
    description: String,
    icon: String,
    unlockedAt: { type: Date, default: Date.now },
  }],
  gameStats: {
    type: Map,
    of: {
      highScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
    },
    default: {},
  },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ totalScore: -1 });
UserSchema.index({ loginStreak: -1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);