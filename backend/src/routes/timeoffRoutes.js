const express = require('express');
const router = express.Router();
const { authenticate, requireAdminOrHr } = require('../middleware/auth');
const {
  getAllocation,
  createRequest,
  listRequests,
  reviewRequest,
} = require('../controllers/timeoffController');

router.use(authenticate);

router.get('/allocation', getAllocation);
router.get('/requests', listRequests);
router.post('/requests', createRequest);
router.patch('/requests/:id', requireAdminOrHr, reviewRequest);

module.exports = router;
