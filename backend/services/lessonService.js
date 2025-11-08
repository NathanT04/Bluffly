const LessonQuestion = require('../models/lessonQuestion');
const { connectMongoose } = require('./mongoClient');

const DIFFICULTY_LABEL_BY_KEY = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard'
};

function sanitizeLimit(rawLimit, fallback) {
  const asNumber = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(asNumber)) {
    return fallback;
  }

  return Math.min(Math.max(asNumber, 1), 50);
}

function normalizeDifficultyKey(key) {
  if (typeof key !== 'string') {
    return '';
  }
  return key.trim().toLowerCase();
}

function toOptionArray(document) {
  if (Array.isArray(document.options) && document.options.length > 0) {
    return document.options.filter((option) => typeof option === 'string' && option.trim().length > 0);
  }

  const candidates = [
    document.option_1,
    document.option_2,
    document.option_3,
    document.option_4
  ];

  return candidates
    .filter((option) => typeof option === 'string')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

function toQuizQuestion(document) {
  const correctAnswerIndex =
    typeof document.correct_answer_index === 'number'
      ? document.correct_answer_index
      : Number.parseInt(document.correct_answer_index, 10);

  return {
    id: document.id,
    prompt: document.question,
    options: toOptionArray(document),
    correctAnswerIndex:
      Number.isInteger(correctAnswerIndex) && correctAnswerIndex >= 0
        ? correctAnswerIndex
        : undefined,
    explanation: document.explanation ?? undefined
  };
}

exports.fetchRandomQuestionsByDifficulty = async (difficultyKey, rawLimit) => {
  const key = normalizeDifficultyKey(difficultyKey);
  const difficultyLabel = DIFFICULTY_LABEL_BY_KEY[key];

  if (!difficultyLabel) {
    const error = new Error('Unsupported lesson difficulty.');
    error.statusCode = 400;
    throw error;
  }

  const limit = sanitizeLimit(rawLimit, 10);
  await connectMongoose();

  const pipeline = [
    { $match: { difficulty: difficultyLabel } },
    { $sample: { size: limit } },
    {
      $project: {
        _id: 0,
        id: 1,
        question: 1,
        options: 1,
        option_1: 1,
        option_2: 1,
        option_3: 1,
        option_4: 1,
        correct_answer_index: 1,
        explanation: 1
      }
    }
  ];

  const documents = await LessonQuestion.aggregate(pipeline).exec();

  return {
    difficultyKey: key,
    difficulty: difficultyLabel,
    limit,
    count: documents.length,
    questions: documents.map(toQuizQuestion)
  };
};
