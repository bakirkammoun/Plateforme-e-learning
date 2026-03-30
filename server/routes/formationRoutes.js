const express = require('express');
const router = express.Router();
const Formation = require('../models/Formation');
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// Route pour changer le statut d'une formation
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const formation = await Formation.findById(req.params.id);

    if (!formation) {
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    formation.status = status;
    await formation.save();

    res.json(formation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de test pour vérifier si une formation existe
router.get('/:id/check', async (req, res) => {
  try {
    const formationId = req.params.id;
    console.log('Vérification de la formation:', formationId);

    // Vérifier si l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(formationId)) {
      console.log('ID invalide:', formationId);
      return res.status(400).json({ 
        message: 'ID de formation invalide',
        error: 'Format d\'ID incorrect'
      });
    }

    // Chercher la formation
    const formation = await Formation.findById(formationId);
    if (!formation) {
      console.log('Formation non trouvée pour l\'ID:', formationId);
      return res.status(404).json({ 
        message: 'Formation non trouvée',
        error: 'Aucune formation avec cet ID'
      });
    }

    console.log('Formation trouvée:', {
      id: formation._id,
      title: formation.title,
      status: formation.status
    });

    res.json({
      message: 'Formation trouvée',
      formation: {
        id: formation._id,
        title: formation.title,
        status: formation.status
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification',
      error: error.message
    });
  }
});

// Route pour s'inscrire à une formation
router.post('/:id/register', auth, async (req, res) => {
    try {
        console.log('=== Début de l\'inscription ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('User:', req.user);
        console.log('Formation ID:', req.params.id);

        // Vérifier si l'utilisateur est connecté
        if (!req.user) {
            console.error('Utilisateur non authentifié');
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }

        // Récupérer l'ID utilisateur (priorité au body, sinon utiliser req.user)
        const userId = req.body.userId || req.user._id || req.user.id;
        console.log('User ID utilisé:', userId);

        if (!userId) {
            console.error('ID utilisateur manquant');
            return res.status(400).json({ 
                message: 'ID utilisateur manquant',
                body: req.body,
                user: req.user
            });
        }

        // Vérifier si l'ID de la formation est valide
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error('ID de formation invalide:', req.params.id);
            return res.status(400).json({ 
                message: 'ID de formation invalide',
                receivedId: req.params.id
            });
        }

        // Vérifier si l'ID de l'utilisateur est valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('ID utilisateur invalide:', userId);
            return res.status(400).json({ 
                message: 'ID utilisateur invalide',
                receivedId: userId
            });
        }

        // Vérifier si la formation existe
        const formation = await Formation.findById(req.params.id);
        if (!formation) {
            console.error('Formation non trouvée:', req.params.id);
            return res.status(404).json({ message: 'Formation non trouvée' });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            console.error('Utilisateur non trouvé:', userId);
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérifier si l'utilisateur est déjà inscrit
        if (formation.enrolledStudents.includes(userId)) {
            console.error('Utilisateur déjà inscrit:', userId);
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à cette formation' });
        }

        // Mettre à jour la formation
        formation.enrolledStudents.push(userId);
        await formation.save();
        console.log('Formation mise à jour avec succès');

        // Mettre à jour l'utilisateur
        if (!user.enrolledFormations) {
            user.enrolledFormations = [];
        }
        user.enrolledFormations.push(req.params.id);
        await user.save();
        console.log('Utilisateur mis à jour avec succès');

        res.status(200).json({ 
            message: 'Inscription réussie',
            formation: formation._id,
            user: user._id
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            path: error.path,
            value: error.value,
            user: req.user,
            body: req.body
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Erreur de validation',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'ID invalide',
                receivedId: error.value,
                expectedType: 'ObjectId'
            });
        }

        console.log('Détails de la réponse:', error.response.data);

        // Ajouter un log spécifique pour les détails de l'erreur 400
        if (error.response?.status === 400) {
            console.error('Détails de l\'erreur 400:', {
                message: error.response.data.message,
                error: error.response.data.error,
                details: error.response.data.details,
                body: error.response.data.body,
                user: error.response.data.user
            });
        }

        res.status(500).json({ 
            message: 'Erreur lors de l\'inscription à la formation',
            error: error.message
        });
    }
});

// Route pour vérifier si un utilisateur est inscrit à une formation
router.get('/:id/check-enrollment', auth, async (req, res) => {
  try {
    const formationId = req.params.id;
    const userId = req.user.id;

    console.log('Vérification d\'inscription:', { formationId, userId });

    // Vérifier si l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(formationId)) {
      console.log('ID de formation invalide:', formationId);
      return res.status(400).json({ message: 'ID de formation invalide' });
    }

    const formation = await Formation.findById(formationId);
    if (!formation) {
      console.log('Formation non trouvée:', formationId);
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    const isEnrolled = formation.enrolledStudents.includes(userId);
    console.log('Statut d\'inscription:', { isEnrolled });
    res.status(200).json({ isEnrolled });

  } catch (error) {
    console.error('Erreur détaillée lors de la vérification:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de l\'inscription',
      error: error.message 
    });
  }
});

// Autres routes existantes...

module.exports = router; 