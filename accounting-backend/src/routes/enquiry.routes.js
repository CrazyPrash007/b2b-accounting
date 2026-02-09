// src/routes/enquiry.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/enquiry.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, respond: respondSchema } = require('../validators/enquiry.validator');

// All routes require authentication
router.use(auth);

// My enquiries
router.get('/my', controller.listMyEnquiries);

// Public enquiries (others' open enquiries)
router.get('/public', controller.listPublicEnquiries);

// Vendor-targeted enquiries (enquiries sent specifically to the user)
router.get('/vendor', controller.listVendorEnquiries);

// My responses (enquiries user has responded to)
router.get('/my-responses', controller.listMyResponses);

// Website enquiries (from marketing website)
router.get('/website', controller.listWebsiteEnquiries);

// Get registered vendors (vendors from user's list who are on the platform)
router.get('/registered-vendors', controller.getRegisteredVendors);

// Create new enquiry
router.post('/', validate(createSchema), controller.create);

// Get single enquiry
router.get('/:id', controller.getOne);

// Get responses for an enquiry (with filtering/sorting)
router.get('/:id/responses', controller.getEnquiryResponses);

// Delete enquiry (soft delete) - No edit endpoint anymore
router.delete('/:id', controller.remove);

// Respond to an enquiry
router.post('/:id/respond', validate(respondSchema), controller.respond);

// Close an enquiry
router.patch('/:id/close', controller.closeEnquiry);

// Mark response as viewed
router.patch('/:id/responses/:responseId/viewed', controller.markResponseViewed);

// Select/Accept a response (rejects all others)
router.patch('/:id/responses/:responseId/select', controller.selectResponse);

module.exports = router;
