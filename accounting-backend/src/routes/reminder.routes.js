// src/routes/reminder.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminder.controller');
const authenticate = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Status toggle route
router.patch('/:id/status', controller.toggleStatus);

// Feedback route
router.patch('/:id/feedback', controller.addFeedback);

module.exports = router;
