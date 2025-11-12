const express = require('express');
const controller = require('../controllers/tableController');

const router = express.Router();

router.post('/', controller.createTable);
router.get('/:id', controller.getTable);
router.post('/:id/action', controller.act);
// legacy next endpoint (optional)
// router.post('/:id/next', controller.next);

module.exports = router;
