const express = require('express');
const controller = require('../controllers/lessonController');

const router = express.Router();

router.get('/quiz', controller.getQuizByDifficulty);

module.exports = router;

