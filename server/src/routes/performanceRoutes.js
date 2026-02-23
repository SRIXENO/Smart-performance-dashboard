const express = require('express');
const { getPerformance, createPerformance, updatePerformance, deletePerformance } = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getPerformance);
router.post('/', authMiddleware, roleMiddleware(['admin']), createPerformance);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), updatePerformance);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deletePerformance);

module.exports = router;
