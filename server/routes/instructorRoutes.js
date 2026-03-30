const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const auth = require('../middleware/auth');
const User = require('../models/User');
const CV = require('../models/CV');
const Instructor = require('../models/Instructor');
const Formation = require('../models/Formation');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Get count of all instructors (public route)
router.get('/count', instructorController.getInstructorCount);

// Get instructor by ID (public)
router.get('/:id', instructorController.getInstructorById);

// Get all instructors (public)
router.get('/', instructorController.getAllInstructors);

// Get instructor stats
router.get('/:instructorId/stats', async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    console.log('Recherche des stats pour instructeur:', instructorId);
    
    // Vérifier si l'instructeur existe
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructeur non trouvé" });
    }

    // Compter le nombre total de formations
    const totalFormations = await Formation.countDocuments({ instructorId: instructorId });
    console.log('Total formations:', totalFormations);

    // Compter le nombre total d'étudiants encadrés
    const formations = await Formation.find({ instructorId: instructorId });
    console.log(`Nombre de formations trouvées: ${formations.length}`);
    
    let totalStudents = 0;
    let totalRating = 0;
    let totalRatings = 0;
    
    formations.forEach((formation, index) => {
      console.log(`Formation ${index + 1}: ${formation.title}`);
      console.log(`Nombre d'étudiants inscrits: ${formation.enrolledStudents ? formation.enrolledStudents.length : 0}`);
      
      if (formation.enrolledStudents && Array.isArray(formation.enrolledStudents)) {
        totalStudents += formation.enrolledStudents.length;
      }
      
      // Calculer le taux de satisfaction moyen
      if (formation.rating && formation.numberOfRatings) {
        totalRating += formation.rating * formation.numberOfRatings;
        totalRatings += formation.numberOfRatings;
      }
    });
    
    console.log('Total étudiants encadrés:', totalStudents);
    console.log('Total rating:', totalRating);
    console.log('Total ratings:', totalRatings);
    
    // Calculer le taux de satisfaction moyen
    const averageRating = totalRatings > 0 ? (totalRating / totalRatings).toFixed(1) : 0;
    console.log('Taux de satisfaction moyen:', averageRating);

    // Compter le nombre total de messages dans le messager
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: instructorId },
        { receiver: instructorId }
      ]
    });
    console.log('Total messages:', totalMessages);

    res.json({
      totalFormations,
      totalStudents,
      averageRating,
      totalMessages
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
  }
});

// Get followed instructors for a user
router.get('/user/:userId/followed', auth, instructorController.getFollowedInstructors);

// Rate an instructor (public)
router.post('/:id/rate', instructorController.rateInstructor);

// Follow an instructor (public)
router.post('/:id/follow', async (req, res) => {
  try {
    const { id: instructorId } = req.params;
    const { action, userId } = req.body;

    console.log('Follow request:', { instructorId, userId, action });

    // Validation de base
    if (!action || !['follow', 'unfollow'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "follow" or "unfollow"' });
    }

    if (!userId || !instructorId) {
      return res.status(400).json({ message: 'Both instructor ID and user ID are required' });
    }

    // Vérifier si l'instructeur existe et est bien un instructeur
    const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Vérifier si le follower existe
    const follower = await User.findById(userId);
    if (!follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updateOperation;
    if (action === 'follow') {
      // Ajouter le follower s'il n'existe pas déjà
      updateOperation = {
        instructor: {
          $addToSet: { followers: userId }
        },
        follower: {
          $addToSet: { following: instructorId }
        }
      };
    } else {
      // Retirer le follower
      updateOperation = {
        instructor: {
          $pull: { followers: userId }
        },
        follower: {
          $pull: { following: instructorId }
        }
      };
    }

    // Effectuer les mises à jour
    await Promise.all([
      User.updateOne(
        { _id: instructorId },
        updateOperation.instructor
      ),
      User.updateOne(
        { _id: userId },
        updateOperation.follower
      )
    ]);

    // Si l'action est 'follow', envoyer une notification à l'instructeur
    if (action === 'follow') {
      try {
        const notification = new Notification({
          recipient: instructorId,
          sender: userId,
          type: 'instructor_followed',
          message: `${follower.firstName} ${follower.lastName} a commencé à vous suivre`,
          data: {
            studentId: userId,
            studentName: `${follower.firstName} ${follower.lastName}`,
            studentImage: follower.profileImage
          }
        });
        await notification.save();
        console.log('Notification de follow envoyée avec succès');
      } catch (notifError) {
        console.error('Erreur lors de l\'envoi de la notification:', notifError);
      }
    }

    // Récupérer le nombre de followers mis à jour
    const updatedInstructor = await User.findById(instructorId);
    const followersCount = updatedInstructor.followers ? updatedInstructor.followers.length : 0;

    res.json({
      success: true,
      message: `Successfully ${action}ed instructor`,
      followers: followersCount
    });

  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error.message
    });
  }
});

// Route pour récupérer la liste des étudiants supervisés
router.get('/supervised-students', auth, async (req, res) => {
  try {
    const instructorId = req.user.id;

    // Vérifier que l'utilisateur est un instructeur
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer tous les CVs supervisés par cet instructeur
    const supervisedCVs = await CV.find({
      supervisorId: instructorId,
      supervisionStatus: 'accepted'
    });

    // Récupérer les informations des étudiants
    const supervisedStudents = await Promise.all(
      supervisedCVs.map(async (cv) => {
        const student = await User.findById(cv.userId);
        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          profileImage: student.profileImage,
          cvId: cv._id,
          cvTitle: cv.title,
          supervisionStartDate: cv.supervisionStartDate
        };
      })
    );

    res.json(supervisedStudents);
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants supervisés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des étudiants supervisés',
      error: error.message
    });
  }
});

// Route pour récupérer les 3 formations les plus inscrites d'un instructeur
router.get('/:instructorId/top-formations', async (req, res) => {
  try {
    const { instructorId } = req.params;
    console.log('Recherche des formations pour instructeur:', instructorId);

    // Récupérer les 3 formations les plus inscrites
    const topFormations = await Formation.find({ instructorId: instructorId })
      .sort({ 'enrolledStudents.length': -1 })
      .limit(3)
      .select('title description image enrolledStudents rating numberOfRatings');

    console.log('Formations trouvées:', topFormations.length);
    res.json(topFormations);
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get count of followed instructors for the logged-in user
router.get('/followed/count', auth, instructorController.getFollowedInstructorsCount);

module.exports = router; 