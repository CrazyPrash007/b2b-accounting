// src/routes/company.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/company.controller');
const auth = require('../middlewares/auth');

// All company routes require authentication
router.use(auth);

router.get('/', controller.listCompanies);

module.exports = router;
