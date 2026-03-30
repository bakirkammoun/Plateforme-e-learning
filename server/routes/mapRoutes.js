const express = require('express');
const router = express.Router();
const { getCitiesData } = require('../controllers/mapController');
const { protect, authorize } = require('../middleware/auth');

// Route pour récupérer les données de localisation des inscriptions
router.get('/cities-data', protect, authorize('admin'), getCitiesData);

module.exports = router; 