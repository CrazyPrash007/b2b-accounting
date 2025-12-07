// src/routes/brand.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/brand.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/brand.validator');

// All routes require owner context for now
router.use(auth);

router.get('/', controller.list);
router.post('/', validate(createSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
