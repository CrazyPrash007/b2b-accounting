// src/routes/receipt.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/receipt.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/receipt.validator');

router.use(auth);

router.get('/', controller.list);
router.post('/', validate(createSchema), controller.create);
router.get('/:id', controller.getOne);
router.get('/:id/pdf', controller.exportPDF);
router.put('/:id', validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
