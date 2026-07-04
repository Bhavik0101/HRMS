const express = require('express');
const router = express.Router();
const { signup, signin, changePassword, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, me);

module.exports = router;
