// src/routes/enquiry.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/enquiry.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema, respond: respondSchema } = require('../validators/enquiry.validator');

// All routes require authentication
router.use(auth);

// My enquiries
router.get('/my', controller.listMyEnquiries);

// Public enquiries (others' open enquiries)
router.get('/public', controller.listPublicEnquiries);

// Create new enquiry
router.post('/', validate(createSchema), controller.create);

// Get single enquiry
router.get('/:id', controller.getOne);

// Update enquiry
router.put('/:id', validate(updateSchema), controller.update);

// Delete enquiry (soft delete)
router.delete('/:id', controller.remove);

// Respond to an enquiry
router.post('/:id/respond', validate(respondSchema), controller.respond);

// Close an enquiry
router.patch('/:id/close', controller.closeEnquiry);

module.exports = router;
