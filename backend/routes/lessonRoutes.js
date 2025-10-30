const express = require('express');
const lessonController = require('../controllers/lessonController');
const quizResultController = require('../controllers/quizResultController');

const router = express.Router();

router.get('/quiz', lessonController.getQuizByDifficulty);
router.post('/results', quizResultController.createResult);
router.get('/results', quizResultController.listResults);

module.exports = router;
