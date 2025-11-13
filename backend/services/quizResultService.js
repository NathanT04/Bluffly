const QuizResult = require('../models/quizResult');
const { connectMongoose } = require('./mongoClient');

const MAX_HISTORY_LIMIT = 50;

function sanitizeLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed)) {
    return 10;
  }
  return Math.min(Math.max(parsed, 1), MAX_HISTORY_LIMIT);
}

exports.createResult = async ({ userId, difficulty, difficultyLabel, correct, total, percentage, metadata }) => {
  await connectMongoose();

  if (!userId) {
    const error = new Error('An authenticated user is required.');
    error.statusCode = 401;
    throw error;
  }

  const safeDifficulty = typeof difficulty === 'string' ? difficulty.trim().toLowerCase() : '';
  const safeLabel = typeof difficultyLabel === 'string' ? difficultyLabel.trim() : '';

  if (!safeDifficulty || !safeLabel) {
    const error = new Error('A valid lesson difficulty is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    const error = new Error('Correct and total answer counts are required.');
    error.statusCode = 400;
    throw error;
  }

  const safeCorrect = Math.max(0, Math.min(correct, total));
  const safePercentage =
    typeof percentage === 'number' && Number.isFinite(percentage)
      ? Math.max(0, Math.min(100, Math.round(percentage)))
      : Math.round((safeCorrect / total) * 100);

  const doc = await QuizResult.create({
    user: userId,
    difficulty: safeDifficulty,
    difficultyLabel: safeLabel,
    correct: safeCorrect,
    total,
    percentage: safePercentage,
    metadata
  });

  return {
    id: doc.id,
    difficulty: doc.difficulty,
    difficultyLabel: doc.difficultyLabel,
    correct: doc.correct,
    total: doc.total,
    percentage: doc.percentage,
    submittedAt: doc.submittedAt
  };
};

exports.listResults = async ({ userId, difficulty, limit } = {}) => {
  await connectMongoose();

  if (!userId) {
    const error = new Error('An authenticated user is required.');
    error.statusCode = 401;
    throw error;
  }

  const query = { user: userId };
  if (typeof difficulty === 'string' && difficulty.trim().length > 0) {
    query.difficulty = difficulty.trim().toLowerCase();
  }

  const docs = await QuizResult.find(query)
    .sort({ submittedAt: -1 })
    .limit(sanitizeLimit(limit))
    .lean()
    .exec();

  return docs.map((doc) => ({
    id: doc._id?.toString() ?? undefined,
    difficulty: doc.difficulty,
    difficultyLabel: doc.difficultyLabel,
    correct: doc.correct,
    total: doc.total,
    percentage: doc.percentage,
    submittedAt: doc.submittedAt
  }));
};
