const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Formation = require('../models/Formation');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Créer une nouvelle inscription
router.post('/', auth, async (req, res) => {
  console.log('Nouvelle demande d\'inscription reçue:', req.body);
  try {
    const { formationId } = req.body;
    const studentId = req.user.id;

    console.log('Données d\'inscription:', { formationId, studentId });

    if (!formationId) {
      return res.status(400).json({ message: 'formationId est requis' });
    }

    if (!studentId) {
      console.error('❌ studentId manquant dans req.user:', req.user);
      return res.status(400).json({ 
        message: 'Erreur d\'authentification',
        details: 'Impossible d\'identifier l\'étudiant. Veuillez vous reconnecter.'
      });
    }

    // Vérifier si la formation existe
    const formation = await Formation.findById(formationId);
    if (!formation) {
      console.log('Formation non trouvée:', formationId);
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    console.log('Formation trouvée:', formation.title);

    // Vérifier si l'inscription existe déjà
    const existingEnrollment = await Enrollment.findOne({ studentId, formationId });
    if (existingEnrollment) {
      console.log('Inscription existante trouvée');
      return res.status(400).json({ message: 'Déjà inscrit à cette formation' });
    }

    // Créer l'inscription
    const enrollment = new Enrollment({
      studentId,
      formationId,
      status: 'pending',
      progress: 0,
      purchaseDate: new Date()
    });

    const savedEnrollment = await enrollment.save();

    // Récupérer les informations de la formation et de l'étudiant
    const formationInfo = await Formation.findById(formationId);
    const student = await User.findById(studentId);
    
    // Créer une notification pour l'instructeur
    const notification = new Notification({
      recipient: formationInfo.instructorId,
      sender: studentId,
      message: `Un nouvel étudiant souhaite s'inscrire à votre formation "${formationInfo.title}"`,
      type: 'enrollment_request',
      formationId: formationInfo._id,
      enrollmentId: savedEnrollment._id
    });

    await notification.save();
    
    // Créer une notification pour l'admin
    const adminNotification = new Notification({
      recipientRole: 'admin',
      sender: studentId,
      message: `Nouvelle demande d'inscription de ${student.firstName} ${student.lastName} pour la formation "${formationInfo.title}"`,
      type: 'enrollment_request',
      formationId: formationInfo._id,
      enrollmentId: savedEnrollment._id,
      data: {
        formationTitle: formationInfo.title,
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student._id,
        formationId: formationInfo._id,
        enrollmentId: savedEnrollment._id
      }
    });
    
    await adminNotification.save();
    console.log('Notification d\'inscription envoyée à l\'admin');

    res.status(201).json(savedEnrollment);
  } catch (error) {
    console.error('Erreur lors de la création de l\'inscription:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Données d\'inscription invalides',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'inscription',
      error: error.message 
    });
  }
});

// Obtenir toutes les inscriptions d'un étudiant
router.get('/student/enrollments', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user.id })
      .populate('formationId')
      .sort({ purchaseDate: -1 });
    res.json(enrollments);
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtenir toutes les inscriptions pour un enseignant
router.get('/instructor/enrollments', auth, async (req, res) => {
  try {
    const formations = await Formation.find({ instructorId: req.user.id });
    const formationIds = formations.map(f => f._id);

    const enrollments = await Enrollment.find({ 
      formationId: { $in: formationIds } 
    })
    .populate('studentId', 'firstName lastName email')
    .populate('formationId', 'title')
    .sort({ purchaseDate: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Approuver ou rejeter une inscription
router.patch('/:enrollmentId/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate('formationId')
      .populate('studentId');

    if (!enrollment) {
      return res.status(404).json({ message: 'Inscription non trouvée' });
    }

    // Vérifier si l'utilisateur est l'instructeur ou un admin
    const user = await User.findById(req.user.id);
    const formation = await Formation.findById(enrollment.formationId);
    
    if (formation.instructorId.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    enrollment.status = status;
    enrollment.notes = notes;
    if (status === 'approved') {
      enrollment.approvalDate = new Date();
    }

    await enrollment.save();

    // Créer une notification pour l'étudiant
    const notification = new Notification({
      recipient: enrollment.studentId._id,
      sender: req.user.id,
      message: status === 'approved' 
        ? `Votre inscription à la formation "${enrollment.formationId.title}" a été approuvée !`
        : `Votre inscription à la formation "${enrollment.formationId.title}" a été rejetée.${notes ? ` Motif: ${notes}` : ''}`,
      type: status === 'approved' ? 'enrollment_approved' : 'enrollment_rejected',
      formationId: enrollment.formationId._id,
      enrollmentId: enrollment._id
    });

    await notification.save();

    res.json(enrollment);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer toutes les inscriptions (pour l'admin)
router.get('/all', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé. Accès réservé aux administrateurs.' });
    }

    const enrollments = await Enrollment.find()
      .populate('studentId', 'firstName lastName email profileImage')
      .populate('formationId', 'title category description price')
      .sort({ purchaseDate: -1 });
    
    console.log(`Récupération de ${enrollments.length} inscriptions pour l'admin`);
    
    res.json(enrollments);
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions pour l\'admin:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router; 