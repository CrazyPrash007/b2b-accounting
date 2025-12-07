// src/routes/expense.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/expense.controller');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/expense.validator');


router.use(auth);
router.get('/', controller.list);
router.post('/', controller.uploadMiddleware, validate(createSchema), controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.uploadMiddleware, validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/receipt', controller.downloadReceipt);

module.exports = router;
