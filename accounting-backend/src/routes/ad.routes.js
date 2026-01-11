// src/routes/ad.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ad.controller');
const auth = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Get targeting options (categories, positions, states)
router.get('/targeting-options', controller.getTargetingOptions);

// Get user's ad stats
router.get('/my-stats', controller.getMyStats);

// List user's own ads
router.get('/my', controller.listMyAds);

// Create new ad
router.post('/', controller.create);

// Get single ad
router.get('/:id', controller.getOne);

// Update ad
router.put('/:id', controller.update);

// Delete ad (soft delete)
router.delete('/:id', controller.remove);

// Stop ad
router.patch('/:id/stop', controller.stopAd);

// Reactivate ad
router.patch('/:id/reactivate', controller.reactivateAd);

module.exports = router;
