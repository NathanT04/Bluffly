const { Schema, model } = require('mongoose');

const collectionName = process.env.MONGODB_COLLECTION || 'pokerLessonQuiz';

const lessonQuestionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    difficulty: { type: String, required: true },
    category: { type: String },
    question: { type: String, required: true },
    option_1: { type: String },
    option_2: { type: String },
    option_3: { type: String },
    option_4: { type: String },
    options: { type: [String], default: [] },
    correct_answer: { type: String },
    correct_answer_index: { type: Number },
    explanation: { type: String },
    tags: { type: [String], default: [] }
  },
  {
    minimize: false,
    versionKey: false
  }
);

lessonQuestionSchema.index({ id: 1 }, { unique: true });

module.exports = model('LessonQuestion', lessonQuestionSchema, collectionName);

