const express = require('express');
const router = express.Router();
const { authenticate, requireAdminOrHr } = require('../middleware/auth');
const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getSalary,
  updateSalary,
} = require('../controllers/employeeController');

router.use(authenticate);

router.get('/', listEmployees);
router.post('/', requireAdminOrHr, createEmployee);
router.get('/:id', getEmployee);
router.put('/:id', updateEmployee);

router.get('/:id/salary', getSalary);
router.put('/:id/salary', requireAdminOrHr, updateSalary);

module.exports = router;
