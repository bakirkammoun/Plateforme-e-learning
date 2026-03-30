const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const CV = require('../models/CV');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Création du dossier uploads/messages s'il n'existe pas
const uploadDir = path.join(__dirname, '../../uploads/messages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

// Route pour obtenir le nombre de messages non lus
router.get('/unread-count', auth, async (req, res) => {
  try {
    console.log('Comptage des messages non lus pour l\'utilisateur:', req.user.id);
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false
    });
    console.log('Nombre de messages non lus:', count);
    res.json({ count });
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error);
    res.status(500).json({ 
      message: 'Erreur lors du comptage des messages non lus',
      error: error.message 
    });
  }
});

// Route pour marquer tous les messages comme lus
router.post('/mark-as-read', auth, async (req, res) => {
  try {
    console.log('Marquage des messages comme lus pour l\'utilisateur:', req.user.id);
    
    const result = await Message.updateMany(
      { 
        recipient: req.user.id,
        read: false 
      },
      { 
        $set: { read: true } 
      }
    );
    
    console.log('Résultat de la mise à jour:', result);
    
    res.status(200).json({ 
      message: 'Messages marqués comme lus',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
    res.status(500).json({ 
      message: 'Erreur lors du marquage des messages comme lus',
      error: error.message 
    });
  }
});

// Obtenir tous les messages d'une conversation
router.get('/:cvId', auth, async (req, res) => {
  try {
    console.log('Récupération des messages pour le CV:', req.params.cvId);
    console.log('Utilisateur connecté:', req.user.id);

    // Vérifier si le CV existe
    const cv = await CV.findById(req.params.cvId);
    if (!cv) {
      console.log('CV non trouvé');
      return res.status(404).json({ message: 'CV non trouvé' });
    }

    // Vérifier si l'utilisateur a le droit d'accéder aux messages
    if (cv.userId.toString() !== req.user.id && cv.supervisorId?.toString() !== req.user.id) {
      console.log('Accès non autorisé aux messages');
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à ces messages' });
    }

    const messages = await Message.find({
      cvId: req.params.cvId,
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .populate('sender', 'firstName lastName')
    .populate('recipient', 'firstName lastName')
    .sort({ createdAt: 1 });

    console.log('Nombre de messages trouvés:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des messages:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des messages',
      error: error.message 
    });
  }
});

// Envoyer un nouveau message
router.post('/:cvId', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    console.log('Tentative d\'envoi de message pour le CV:', req.params.cvId);
    console.log('Contenu du message:', req.body);
    console.log('Utilisateur connecté:', req.user);

    // Vérifier si le CV existe
    const cv = await CV.findById(req.params.cvId);
    if (!cv) {
      console.log('CV non trouvé');
      return res.status(404).json({ message: 'CV non trouvé' });
    }

    // Vérifier si l'utilisateur est l'étudiant ou le superviseur
    const isStudent = cv.userId.toString() === req.user.id;
    const isSupervisor = cv.supervisorId && cv.supervisorId.toString() === req.user.id;

    console.log('Vérification des permissions:', {
      isStudent,
      isSupervisor,
      cvUserId: cv.userId,
      supervisorId: cv.supervisorId,
      requestUserId: req.user.id
    });

    if (!isStudent && !isSupervisor) {
      console.log('Utilisateur non autorisé à envoyer des messages');
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à envoyer des messages pour ce CV' });
    }

    // Vérifier que la supervision est acceptée
    if (cv.supervisionStatus !== 'accepted') {
      console.log('Supervision non acceptée');
      return res.status(403).json({ message: 'La supervision doit être acceptée pour pouvoir échanger des messages' });
    }

    // Déterminer le destinataire
    let finalRecipientId;
    if (isStudent) {
      finalRecipientId = cv.supervisorId;
    } else {
      finalRecipientId = cv.userId;
    }

    if (!finalRecipientId) {
      console.log('Destinataire non trouvé');
      return res.status(400).json({ message: 'Impossible de déterminer le destinataire' });
    }

    console.log('Destinataire final:', finalRecipientId);

    const { content } = req.body;

    // Validation du contenu
    if (!content && (!req.files || req.files.length === 0)) {
      console.log('Message vide');
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype
    })) : [];

    const message = new Message({
      sender: req.user.id,
      recipient: finalRecipientId,
      content: content || '',
      attachments,
      cvId: req.params.cvId
    });

    await message.save();
    console.log('Message enregistré avec succès:', message._id);

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName')
      .populate('recipient', 'firstName lastName');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi du message:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
});

// Marquer un message comme lu
router.patch('/:messageId/read', auth, async (req, res) => {
  try {
    console.log('Marquage du message comme lu:', req.params.messageId);
    
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    if (message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    message.isRead = true;
    await message.save();
    console.log('Message marqué comme lu avec succès');

    res.json(message);
  } catch (error) {
    console.error('Erreur détaillée lors de la mise à jour du message:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du message',
      error: error.message 
    });
  }
});

// Télécharger un fichier attaché
router.get('/attachment/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error('Fichier non trouvé:', filePath);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log('Téléchargement du fichier:', filename);
    res.download(filePath);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    res.status(500).json({ 
      message: 'Erreur lors du téléchargement du fichier',
      error: error.message 
    });
  }
});

module.exports = router; 