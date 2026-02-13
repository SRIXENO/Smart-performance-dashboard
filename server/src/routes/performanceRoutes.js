const express = require('express');
const { getPerformance, createPerformance, updatePerformance, deletePerformance } = require('../controllers/performanceController');

const router = express.Router();

router.get('/', getPerformance);
router.post('/', createPerformance);
router.put('/:id', updatePerformance);
router.delete('/:id', deletePerformance);

module.exports = router;