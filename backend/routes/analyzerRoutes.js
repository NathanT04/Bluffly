const express = require('express');
const analyzerController = require('../controllers/analyzerController');

const router = express.Router();

router.post('/equity', analyzerController.analyzeEquity);

module.exports = router;
