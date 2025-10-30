const lessonService = require('../services/lessonService');

exports.getQuizByDifficulty = async (req, res, next) => {
  const { difficulty, limit } = req.query;

  if (!difficulty) {
    const error = new Error('The "difficulty" query parameter is required.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const quiz = await lessonService.fetchRandomQuestionsByDifficulty(difficulty, limit);
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

