const express = require('express');
const router = express.Router();
const { getDemographicData } = require('../controllers/demographicController');
const { protect, authorize } = require('../middleware/auth');

// Route pour obtenir les données démographiques (protégée, accessible uniquement aux admins)
router.get('/demographic-data', protect, authorize('admin'), getDemographicData);

module.exports = router; 