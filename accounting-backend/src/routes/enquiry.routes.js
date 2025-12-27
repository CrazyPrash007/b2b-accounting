// src/routes/enquiry.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/enquiry.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema, respond: respondSchema } = require('../validators/enquiry.validator');

// All routes require authentication
router.use(auth);
router.get('/my', controller.listMyEnquiries);
router.get('/public', controller.listPublicEnquiries);
router.post('/', validate(createSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/respond', validate(respondSchema), controller.respond);
router.patch('/:id/close', controller.closeEnquiry);

module.exports = router;
