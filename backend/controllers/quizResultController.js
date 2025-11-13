const quizResultService = require('../services/quizResultService');

exports.createResult = async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const payload = {
      userId,
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
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const results = await quizResultService.listResults({
      userId,
      difficulty: req.query?.difficulty,
      limit: req.query?.limit
    });
    res.json({ count: results.length, results });
  } catch (error) {
    next(error);
  }
};
