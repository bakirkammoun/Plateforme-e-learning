const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CV = require('../models/CV');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const fs = require('fs');

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/cv-images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Créer ou mettre à jour un CV
router.post('/', auth, upload.single('profileImage'), async (req, res) => {
  try {
    // Log détaillé des données reçues
    console.log('=== Début de la requête POST CV ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('File:', req.file);

    // Vérifier que l'ID utilisateur est présent et valide
    if (!req.user || !req.user.id) {
      console.error('ID utilisateur manquant dans la requête');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'ID est un ObjectId MongoDB valide
    if (!require('mongoose').Types.ObjectId.isValid(req.user.id)) {
      console.error('ID utilisateur invalide:', req.user.id);
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Créer l'objet de données du CV avec des valeurs par défaut
    let cvData = {
      userId: req.user.id,
      name: req.body.name || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      linkedin: req.body.linkedin || '',
      github: req.body.github || '',
      summary: req.body.summary || '',
      technicalSkills: req.body.technicalSkills || '',
      softSkills: req.body.softSkills || '',
      languages: req.body.languages || '',
      workExperience: [],
      education: [],
      projects: [],
      certifications: []
    };

    console.log('CV Data initial:', cvData);

    // Parse arrays with validation
    try {
      ['workExperience', 'education', 'projects', 'certifications'].forEach(field => {
        console.log(`Traitement du champ ${field}:`, req.body[field]);
        if (req.body[field]) {
          try {
            let parsedData;
            if (typeof req.body[field] === 'string') {
              parsedData = JSON.parse(req.body[field]);
            } else if (Array.isArray(req.body[field])) {
              parsedData = req.body[field];
            } else {
              throw new Error(`Le champ ${field} doit être une chaîne JSON ou un tableau`);
            }

            if (!Array.isArray(parsedData)) {
              throw new Error(`${field} doit être un tableau`);
            }

            // Validation de la structure des objets dans le tableau
            parsedData.forEach((item, index) => {
              if (typeof item !== 'object') {
                throw new Error(`L'élément ${index} de ${field} doit être un objet`);
              }
            });

            cvData[field] = parsedData;
            console.log(`${field} parsé avec succès:`, cvData[field]);
          } catch (parseError) {
            console.error(`Erreur parsing ${field}:`, parseError);
            throw new Error(`Format invalide pour ${field}: ${parseError.message}`);
          }
        }
      });
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return res.status(400).json({
        success: false,
        message: parseError.message
      });
    }

    // Handle profile image
    if (req.file) {
      console.log('Image de profil reçue:', req.file.filename);
      cvData.profileImage = req.file.filename;
    }

    console.log('Données CV préparées:', JSON.stringify(cvData, null, 2));

    // Vérifier si un CV existe déjà
    let existingCV = await CV.findOne({ userId: req.user.id });
    console.log('CV existant trouvé:', existingCV ? 'Oui' : 'Non');

    let cv;
    try {
      if (existingCV) {
        console.log('Mise à jour du CV existant');
        // Si une nouvelle image est téléchargée, supprimer l'ancienne
        if (req.file && existingCV.profileImage) {
          const oldImagePath = path.join('uploads/cv-images/', existingCV.profileImage);
          try {
            if (require('fs').existsSync(oldImagePath)) {
              require('fs').unlinkSync(oldImagePath);
              console.log('Ancienne image supprimée:', oldImagePath);
            }
          } catch (err) {
            console.error('Erreur lors de la suppression de l\'ancienne image:', err);
          }
        }

        // Mettre à jour le CV existant
        cv = await CV.findOneAndUpdate(
          { userId: req.user.id },
          { $set: cvData },
          { 
            new: true,
            runValidators: true
          }
        );
      } else {
        console.log('Création d\'un nouveau CV');
        // Créer un nouveau CV
        cv = new CV(cvData);
        await cv.save();
      }

      console.log('CV sauvegardé avec succès:', cv);

      res.status(200).json({
        success: true,
        message: existingCV ? 'CV mis à jour avec succès' : 'CV créé avec succès',
        cv
      });
    } catch (dbError) {
      console.error('Erreur lors de l\'opération MongoDB:', {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
        stack: dbError.stack
      });
      throw dbError;
    }

  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      errors: error.errors
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation des données',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({
        success: false,
        message: 'Erreur de base de données',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde du CV',
      error: error.message,
      details: error.errors || error.code
    });
  }
});

// Récupérer mon CV
router.get('/me', auth, async (req, res) => {
  try {
    const cv = await CV.findOne({ userId: req.user.id });
    
    // Si aucun CV n'existe, retourner un CV vide avec les valeurs par défaut
    if (!cv) {
      const emptyCV = {
        userId: req.user.id,
        name: '',
        phone: '',
        email: '',
        address: '',
        linkedin: '',
        github: '',
        summary: '',
        technicalSkills: '',
        softSkills: '',
        languages: '',
        workExperience: [],
        education: [],
        projects: [],
        certifications: []
      };
      
      return res.json({ 
        success: true, 
        cv: emptyCV,
        isNew: true
      });
    }

    res.json({ 
      success: true, 
      cv,
      isNew: false
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du CV:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du CV'
    });
  }
});

// Récupérer l'ID d'un instructeur
router.get('/instructor/:firstName/:lastName', auth, async (req, res) => {
  try {
    const { firstName, lastName } = req.params;
    const instructor = await User.findOne({
      firstName: new RegExp(firstName, 'i'),
      lastName: new RegExp(lastName, 'i'),
      role: 'instructor'
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructeur non trouvé'
      });
    }

    res.json({
      success: true,
      instructorId: instructor._id
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de l\'instructeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de l\'instructeur'
    });
  }
});

// Récupérer un CV spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Tentative d\'accès au CV:', {
      cvId: req.params.id,
      userId: req.user.id
    });

    const cv = await CV.findById(req.params.id);
    if (!cv) {
      console.log('CV non trouvé');
      return res.status(404).json({ 
        success: false,
        message: 'CV non trouvé' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    const isOwner = cv.userId.toString() === req.user.id;
    const isInstructor = user.role === 'instructor';
    const isAdmin = user.role === 'admin';

    console.log('Vérification des droits:', {
      isOwner,
      isInstructor,
      isAdmin,
      userRole: user.role
    });

    if (!isOwner && !isInstructor && !isAdmin) {
      console.log('Accès non autorisé');
      return res.status(403).json({ 
        success: false,
        message: 'Accès non autorisé' 
      });
    }

    // Populate les informations nécessaires
    await cv.populate('userId', 'firstName lastName email profileImage');
    
    console.log('Accès autorisé, envoi du CV');
    res.json({ success: true, cv });
  } catch (error) {
    console.error('Erreur lors de la récupération du CV:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération du CV',
      error: error.message 
    });
  }
});

// Partager un CV (demande d'encadrement)
router.post('/share/:cvId', auth, async (req, res) => {
  try {
    const { cvId } = req.params;
    const { instructorId } = req.body;
    const studentId = req.user.id;

    console.log('Nouvelle demande d\'encadrement:', {
      cvId,
      instructorId,
      studentId
    });

    if (!cvId || !instructorId) {
      return res.status(400).json({
        success: false,
        message: 'ID du CV et ID de l\'instructeur requis'
      });
    }

    // Vérifier si le CV existe
    const cv = await CV.findById(cvId).populate('userId', 'firstName lastName email profileImage');
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    // Vérifier si l'utilisateur est propriétaire du CV
    const cvUserId = cv.userId._id ? cv.userId._id.toString() : cv.userId.toString();
    if (cvUserId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à partager ce CV'
      });
    }

    // Vérifier si l'instructeur existe
    const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructeur non trouvé'
      });
    }

    // Vérifier si une demande d'encadrement existe déjà
    if (cv.supervisorId && cv.supervisionStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Une demande d\'encadrement est déjà en cours pour ce CV'
      });
    }

    // Mettre à jour le CV avec la demande d'encadrement
    cv.supervisionStatus = 'pending';
    cv.supervisorId = instructorId;
    cv.supervisionRequestDate = new Date();
    await cv.save();

    // Envoyer une notification à l'instructeur
    try {
      console.log('Début de l\'envoi de la notification à l\'instructeur...');
      console.log('Données de la notification:', {
        recipient: instructorId,
        sender: studentId,
        type: 'supervision_request',
        message: `Nouvelle demande d'encadrement de ${cv.userId.firstName} ${cv.userId.lastName}`,
        data: {
          cvId: cv._id,
          studentId: studentId,
          studentName: `${cv.userId.firstName} ${cv.userId.lastName}`,
          studentEmail: cv.userId.email,
          studentImage: cv.userId.profileImage
        }
      });
      
      const notification = new Notification({
        recipient: instructorId,
        sender: studentId,
        type: 'supervision_request',
        message: `Nouvelle demande d'encadrement de ${cv.userId.firstName} ${cv.userId.lastName}`,
        data: {
          cvId: cv._id,
          studentId: studentId,
          studentName: `${cv.userId.firstName} ${cv.userId.lastName}`,
          studentEmail: cv.userId.email,
          studentImage: cv.userId.profileImage
        }
      });

      console.log('Notification créée:', notification);
      await notification.save();
      console.log('Notification sauvegardée avec succès:', notification._id);
    } catch (notifError) {
      console.error('Erreur détaillée lors de l\'envoi de la notification:', {
        message: notifError.message,
        stack: notifError.stack,
        name: notifError.name
      });
    }

    res.json({
      success: true,
      message: 'Demande d\'encadrement envoyée avec succès',
      data: {
        cvId: cv._id,
        studentId: studentId,
        instructorId: instructor._id,
        status: 'pending',
        requestDate: cv.supervisionRequestDate
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande d\'encadrement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la demande d\'encadrement',
      error: error.message
    });
  }
});

// Route pour obtenir le statut de supervision
router.get('/supervision/status/:cvId', auth, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    res.json({
      success: true,
      status: cv.supervisionStatus || null
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
});

// Route pour obtenir les CVs supervisés par un instructeur
router.get('/supervised', auth, async (req, res) => {
  try {
    console.log('\n=== Début de la requête GET /supervised ===');
    console.log('1. Vérification de l\'authentification...');
    console.log('User ID:', req.user?.id);
    console.log('Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    });

    if (!req.user?.id) {
      console.log('❌ Erreur: Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    console.log('2. Recherche de l\'utilisateur dans la base de données...');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ Erreur: Utilisateur non trouvé dans la base de données');
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('Utilisateur trouvé:', {
      id: user._id,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`
    });

    if (user.role !== 'instructor') {
      console.log('❌ Erreur: L\'utilisateur n\'est pas un instructeur');
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux instructeurs'
      });
    }

    console.log('3. Recherche des CVs supervisés...');
    console.log('Query:', { supervisorId: req.user.id });

    const supervisedCVs = await CV.find({ 
      supervisorId: req.user.id,
      supervisionStatus: { $in: ['pending', 'accepted', 'rejected'] }
    }).populate('userId', 'firstName lastName email profileImage');

    console.log('4. Résultats de la recherche:');
    console.log('Nombre de CVs trouvés:', supervisedCVs.length);
    console.log('Détails des CVs:', supervisedCVs.map(cv => ({
      id: cv._id,
      studentName: cv.userId ? `${cv.userId.firstName} ${cv.userId.lastName}` : 'Inconnu',
      status: cv.supervisionStatus,
      date: cv.supervisionRequestDate
    })));

    console.log('5. Envoi de la réponse...');
    res.json({
      success: true,
      cvs: supervisedCVs
    });

    console.log('=== Fin de la requête GET /supervised (succès) ===\n');

  } catch (error) {
    console.error('\n❌ ERREUR dans /supervised:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    if (error.name === 'CastError') {
      console.log('Erreur de cast MongoDB - ID invalide');
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }

    console.log('=== Fin de la requête GET /supervised (erreur) ===\n');
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des CVs supervisés',
      error: error.message
    });
  }
});

// Route pour répondre à une demande d'encadrement
router.post('/:cvId/supervision-response', auth, async (req, res) => {
  try {
    const { cvId } = req.params;
    const { status } = req.body;
    const instructorId = req.user.id;

    console.log('Réponse à la demande d\'encadrement:', {
      cvId,
      status,
      instructorId
    });

    // Vérifier que l'utilisateur est un instructeur
    const user = await User.findById(instructorId);
    if (!user || user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les instructeurs peuvent répondre aux demandes d\'encadrement'
      });
    }

    // Vérifier que le statut est valide
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Mettre à jour le CV
    const cv = await CV.findById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    // Vérifier que l'instructeur est bien le superviseur assigné
    if (cv.supervisorId.toString() !== instructorId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas le superviseur assigné à ce CV'
      });
    }

    // Vérifier si une réponse a déjà été donnée
    if (cv.supervisionStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Une réponse a déjà été donnée pour cette demande d\'encadrement'
      });
    }

    // Mettre à jour le statut
    cv.supervisionStatus = status;
    cv.supervisionResponseDate = new Date();
    await cv.save();

    // Récupérer les informations de l'instructeur
    const instructor = await User.findById(instructorId);

    // Envoyer une notification à l'étudiant
    try {
      const notification = new Notification({
        recipient: cv.userId,
        sender: instructorId,
        type: status === 'accepted' ? 'supervision_accepted' : 'supervision_rejected',
        message: `Votre demande d'encadrement a été ${status === 'accepted' ? 'acceptée' : 'refusée'} par ${instructor.firstName} ${instructor.lastName}`,
        data: {
          cvId: cv._id,
          status: status,
          instructorName: `${instructor.firstName} ${instructor.lastName}`
        }
      });

      await notification.save();
      console.log('Notification envoyée à l\'étudiant avec succès');
    } catch (notifError) {
      console.error('Erreur lors de l\'envoi de la notification:', notifError);
    }

    res.json({
      success: true,
      message: `Demande d'encadrement ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès`,
      status: status
    });
  } catch (error) {
    console.error('Erreur lors de la réponse à la demande d\'encadrement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réponse à la demande d\'encadrement',
      error: error.message
    });
  }
});

// Nouvelle route simplifiée pour récupérer les CVs supervisés
router.get('/instructor/supervised-cvs', auth, async (req, res) => {
  try {
    console.log('=== Début de la requête GET /instructor/supervised-cvs ===');
    
    // 1. Vérification de base de l'authentification
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // 2. Vérification du rôle
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux instructeurs'
      });
    }

    // 3. Récupération de tous les CVs
    const allCVs = await CV.find({})
      .populate('userId', 'firstName lastName email profileImage')
      .lean();

    // 4. Filtrage des CVs où l'utilisateur est superviseur
    const supervisedCVs = allCVs.filter(cv => 
      cv.supervisorId && 
      cv.supervisorId.toString() === req.user.id &&
      cv.supervisionStatus // s'assure que le statut existe
    );

    console.log('CVs supervisés trouvés:', {
      total: supervisedCVs.length,
      cvs: supervisedCVs.map(cv => ({
        id: cv._id,
        studentName: cv.userId ? `${cv.userId.firstName} ${cv.userId.lastName}` : 'Inconnu',
        status: cv.supervisionStatus,
        date: cv.supervisionRequestDate
      }))
    });

    // 5. Envoi de la réponse
    res.json({
      success: true,
      cvs: supervisedCVs.map(cv => ({
        ...cv,
        studentName: cv.userId ? `${cv.userId.firstName} ${cv.userId.lastName}` : 'Inconnu'
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des CVs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des CVs',
      error: error.message
    });
  }
});

// Annuler une demande d'encadrement
router.post('/:cvId/cancel-supervision', auth, async (req, res) => {
  try {
    const { cvId } = req.params;
    const studentId = req.user.id;

    console.log('Annulation de la demande d\'encadrement:', {
      cvId,
      studentId
    });

    // Vérifier si le CV existe
    const cv = await CV.findById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    // Vérifier si l'utilisateur est propriétaire du CV
    const cvUserId = cv.userId._id ? cv.userId._id.toString() : cv.userId.toString();
    if (cvUserId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler cette demande d\'encadrement'
      });
    }

    // Vérifier si une demande d'encadrement est en cours
    if (!cv.supervisorId || cv.supervisionStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Aucune demande d\'encadrement en cours'
      });
    }

    // Annuler la demande
    cv.supervisorId = null;
    cv.supervisionStatus = null;
    await cv.save();

    // Envoyer une notification à l'étudiant
    try {
      const instructor = await User.findById(req.user.id);
      const notification = new Notification({
        recipient: cv.userId,
        sender: req.user.id,
        type: 'supervision_stopped',
        message: `${instructor.firstName} ${instructor.lastName} a arrêté la supervision de votre CV`,
        data: {
          cvId: cv._id,
          instructorName: `${instructor.firstName} ${instructor.lastName}`
        }
      });

      await notification.save();
      console.log('Notification d\'arrêt de supervision envoyée avec succès');
    } catch (notifError) {
      console.error('Erreur lors de l\'envoi de la notification:', notifError);
    }

    res.json({
      success: true,
      message: 'La demande d\'encadrement a été annulée'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la demande d\'encadrement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la demande d\'encadrement',
      error: error.message
    });
  }
});

// Route pour arrêter l'encadrement
router.post('/:cvId/stop-supervision', auth, async (req, res) => {
  try {
    const { cvId } = req.params;
    const instructorId = req.user.id;

    console.log('Arrêt de l\'encadrement:', {
      cvId,
      instructorId
    });

    // Vérifier si le CV existe
    const cv = await CV.findById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    // Vérifier si l'utilisateur est bien l'instructeur
    const user = await User.findById(instructorId);
    if (!user || user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les instructeurs peuvent arrêter l\'encadrement'
      });
    }

    // Vérifier si l'instructeur est bien le superviseur actuel
    if (cv.supervisorId.toString() !== instructorId || cv.supervisionStatus !== 'accepted') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas le superviseur actuel de ce CV'
      });
    }

    // Réinitialiser les informations d'encadrement
    cv.supervisorId = null;
    cv.supervisionStatus = null;
    await cv.save();

    // Envoyer une notification à l'étudiant
    try {
      const instructor = await User.findById(instructorId);
      const notification = new Notification({
        recipient: cv.userId,
        sender: instructorId,
        type: 'supervision_stopped',
        message: `${instructor.firstName} ${instructor.lastName} a arrêté la supervision de votre CV`,
        data: {
          cvId: cv._id,
          instructorName: `${instructor.firstName} ${instructor.lastName}`
        }
      });

      await notification.save();
      console.log('Notification d\'arrêt de supervision envoyée avec succès');
    } catch (notifError) {
      console.error('Erreur lors de l\'envoi de la notification:', notifError);
    }

    res.json({
      success: true,
      message: 'L\'encadrement a été arrêté avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'arrêt de l\'encadrement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'arrêt de l\'encadrement',
      error: error.message
    });
  }
});

// Route pour télécharger un CV
router.get('/download/:filename', auth, (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads/cv', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }
    res.download(filePath);
  } catch (error) {
    console.error('Erreur lors du téléchargement du CV:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du CV'
    });
  }
});

module.exports = router; 