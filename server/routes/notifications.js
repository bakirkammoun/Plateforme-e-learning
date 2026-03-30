const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', auth, notificationController.getMyNotifications);

// Récupérer les notifications de l'utilisateur avec logs détaillés (pour debug)
router.get('/debug', auth, notificationController.getUserNotifications);

// Créer une notification
router.post('/', auth, notificationController.createNotification);

// Marquer une notification comme lue
router.patch('/:id/read', auth, notificationController.markAsRead);

// Marquer toutes les notifications comme lues
router.patch('/mark-all-read', auth, notificationController.markAllAsRead);

module.exports = router; 