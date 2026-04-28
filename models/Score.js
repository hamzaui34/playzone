import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  gameSlug: {
    type: String,
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
  },
  coinsAwarded: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

ScoreSchema.index({ gameSlug: 1, score: -1 });
ScoreSchema.index({ userId: 1, gameSlug: 1, score: -1 });

export default mongoose.models.Score || mongoose.model('Score', ScoreSchema);