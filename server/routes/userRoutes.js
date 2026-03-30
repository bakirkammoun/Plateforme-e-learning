const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// Route pour récupérer tous les instructeurs
router.get('/instructors', auth, async (req, res) => {
  try {
    console.log('Récupération des instructeurs...');
    
    const instructors = await User.find({ 
      role: 'instructor',
      isApproved: true // Ne récupérer que les instructeurs approuvés
    })
    .select('firstName lastName email specialization profileImage bio phone')
    .sort({ firstName: 1, lastName: 1 }); // Trier par nom
    
    console.log(`${instructors.length} instructeurs trouvés`);
    
    res.json({
      success: true,
      instructors: instructors
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des instructeurs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des instructeurs',
      error: error.message 
    });
  }
});

// Obtenir le profil de l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le profil de l'utilisateur
router.patch('/me', auth, async (req, res) => {
  try {
    const updates = req.body;
    // Empêcher la modification de certains champs sensibles
    delete updates.password;
    delete updates.role;
    delete updates.email;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = ['firstName', 'lastName', 'phone', 'bio', 'profileImage'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    // Sauvegarder les modifications
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les détails d'un utilisateur par ID (pour les instructeurs)
router.get('/:userId', auth, async (req, res) => {
  try {
    console.log('Récupération des informations utilisateur:', req.params.userId);
    
    const user = await User.findById(req.params.userId)
      .select('firstName lastName email role profileImage');

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    console.log('Utilisateur trouvé:', user);
    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message 
    });
  }
});

// Route pour mettre à jour le profil utilisateur
router.patch('/profile/:id', auth, userController.updateUserProfile);

// Route pour récupérer le profil utilisateur
router.get('/profile/:id', auth, userController.getUserProfile);

// Route pour l'upload d'image de profil
router.post('/me/profile-image', auth, userController.uploadProfileImage);

// Route pour mettre à jour un utilisateur par ID
router.put('/:userId', auth, async (req, res) => {
  try {
    console.log('=== Mise à jour utilisateur ===');
    console.log('User ID:', req.params.userId);
    console.log('Données:', req.body);

    const user = await User.findById(req.params.userId);
    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = ['firstName', 'lastName', 'phone', 'bio', 'interests', 'profileImage'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Sauvegarder les modifications
    await user.save();

    console.log('Utilisateur mis à jour avec succès');
    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
});

module.exports = router; 