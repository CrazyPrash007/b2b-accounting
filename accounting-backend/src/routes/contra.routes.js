// src/routes/contra.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/contra.controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
