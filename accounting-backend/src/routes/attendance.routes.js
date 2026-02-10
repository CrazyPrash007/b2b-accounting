const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middlewares/auth');
const authorizeCompany = require('../middlewares/authorizeCompany');
const validate = require('../middlewares/validate');
const {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  updateAttendanceSchema,
  attendanceConfigSchema,
} = require('../validators/attendance.validator');

// All routes require authentication and company authorization
router.use(authenticate);
router.use(authorizeCompany);

// Attendance routes
router.post('/', validate(markAttendanceSchema), attendanceController.markAttendance);
router.post('/bulk', validate(bulkMarkAttendanceSchema), attendanceController.bulkMarkAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/summary/:staffId', attendanceController.getAttendanceSummary);
router.put('/:id', validate(updateAttendanceSchema), attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

// Auto-mark absent
router.post('/auto-mark-absent', attendanceController.autoMarkAbsent);

// Attendance config routes
router.get('/config', attendanceController.getAttendanceConfig);
router.put('/config', validate(attendanceConfigSchema), attendanceController.updateAttendanceConfig);

module.exports = router;
