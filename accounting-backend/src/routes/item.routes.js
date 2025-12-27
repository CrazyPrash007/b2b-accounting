// src/routes/item.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/item.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/item.validator');

router.use(auth);

// Global search endpoint - must be before /:id route
router.get('/global-search', controller.globalSearch);

router.get('/', controller.list);
router.post('/', validate(createSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
