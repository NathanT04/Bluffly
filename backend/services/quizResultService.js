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

exports.createResult = async ({ slug, difficulty, correct, total, percentage, metadata }) => {
  await connectMongoose();

  const safeSlug = typeof slug === 'string' ? slug.trim().toLowerCase() : '';
  const safeDifficulty = typeof difficulty === 'string' ? difficulty.trim() : '';

  if (!safeSlug || !safeDifficulty) {
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
    slug: safeSlug,
    difficulty: safeDifficulty,
    correct: safeCorrect,
    total,
    percentage: safePercentage,
    metadata
  });

  return {
    id: doc.id,
    slug: doc.slug,
    difficulty: doc.difficulty,
    correct: doc.correct,
    total: doc.total,
    percentage: doc.percentage,
    submittedAt: doc.submittedAt
  };
};

exports.listResults = async ({ slug, limit } = {}) => {
  await connectMongoose();

  const query = {};
  if (typeof slug === 'string' && slug.trim().length > 0) {
    query.slug = slug.trim().toLowerCase();
  }

  const docs = await QuizResult.find(query)
    .sort({ submittedAt: -1 })
    .limit(sanitizeLimit(limit))
    .lean()
    .exec();

  return docs.map((doc) => ({
    id: doc._id?.toString() ?? undefined,
    slug: doc.slug,
    difficulty: doc.difficulty,
    correct: doc.correct,
    total: doc.total,
    percentage: doc.percentage,
    submittedAt: doc.submittedAt
  }));
};
