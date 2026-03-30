const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

console.log('=== Initialisation du router des notifications par email ===');

// Test route sans auth
router.get('/ping', (req, res) => {
  console.log('Route de ping appelée');
  res.json({ message: 'pong' });
});

// Test route
router.get('/test', (req, res) => {
  console.log('Route de test des emails appelée');
  res.json({ message: 'Route des notifications par email fonctionne' });
});

// Send success email - version simplifiée pour test
router.post('/success', async (req, res) => {
  console.log('=== POST /api/email/success ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  try {
    const { email, formationTitle, studentName, score } = req.body;
    
    console.log('Données reçues:', {
      email,
      formationTitle,
      studentName,
      score
    });

    // Pour le test, on renvoie juste un succès
    res.status(200).json({
      success: true,
      message: 'Test réussi - les données ont été reçues'
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test',
      error: error.message
    });
  }
});

// Export the router
console.log('=== Routes des notifications par email initialisées ===');
module.exports = router; 