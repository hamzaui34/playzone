import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true, // The path to the HTML game, e.g., /games/endless-runner/index.html
  },
  plays: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.Game || mongoose.model('Game', GameSchema);
