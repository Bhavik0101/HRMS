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
// We remove requireAdminOrHr here because a manager can also review their direct reports' requests.
// Authorization will be handled inside the controller.
router.patch('/requests/:id', reviewRequest);

module.exports = router;
