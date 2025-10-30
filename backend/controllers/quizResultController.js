const quizResultService = require('../services/quizResultService');

exports.createResult = async (req, res, next) => {
  try {
    const payload = {
      slug: req.body?.slug,
      difficulty: req.body?.difficulty,
      correct: req.body?.correct,
      total: req.body?.total,
      percentage: req.body?.percentage,
      metadata: req.body?.metadata
    };

    const result = await quizResultService.createResult(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.listResults = async (req, res, next) => {
  try {
    const results = await quizResultService.listResults({
      slug: req.query?.slug,
      limit: req.query?.limit
    });
    res.json({ count: results.length, results });
  } catch (error) {
    next(error);
  }
};
