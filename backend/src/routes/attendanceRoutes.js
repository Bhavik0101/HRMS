const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkIn, checkOut, listAttendance } = require('../controllers/attendanceController');

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/', listAttendance);

module.exports = router;
