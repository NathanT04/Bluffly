const { Schema, model } = require('mongoose');

const quizResultSchema = new Schema(
  {
    difficulty: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    correct: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    submittedAt: { type: Date, default: Date.now },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    versionKey: false
  }
);

quizResultSchema.index({ slug: 1, submittedAt: -1 });

module.exports = model('QuizResult', quizResultSchema);
