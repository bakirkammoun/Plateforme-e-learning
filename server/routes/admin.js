const express = require("express");
const User = require("../models/User");
const router = express.Router();
const Notification = require("../models/Notification"); // Add this line at the top
const CV = require("../models/CV");
const Enrollment = require("../models/Enrollment");
const Formation = require("../models/Formation");
const Order = require("../models/Order");
const Event = require("../models/Event");
const QuizResult = require("../models/QuizResult");
const mongoose = require('mongoose');
const EventParticipant = mongoose.models.EventParticipant || mongoose.model('EventParticipant', new mongoose.Schema({}));

// Get all users (Admin only)
router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Edit user (Admin only)
router.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { firstName, lastName, email, role },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error editing user:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Delete user (Admin only)
router.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Get unapproved instructors (Admin only)
router.get("/users/unapproved", async (req, res) => {
    try {
        const unapprovedInstructors = await User.find({ role: "instructor", isApproved: false });
        res.status(200).json(unapprovedInstructors);
    } catch (error) {
        console.error("Error fetching unapproved instructors:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/notifications", async (req, res) => {
    try {
        const notifications = await Notification.find({ type: "approval" }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Get all notifications for the logged-in user
router.get("/notifications/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.delete("/notifications/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedNotification = await Notification.findByIdAndDelete(id);
        if (!deletedNotification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Approve Instructor (Admin only)
router.put("/users/:id/approve", async (req, res) => {
    try {
        const { id } = req.params;

        // Find user by ID
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Ensure the user is an instructor
        if (user.role !== "instructor") {
            return res.status(400).json({ message: "Only instructors can be approved" });
        }

        // Check if already approved
        if (user.isApproved) {
            return res.status(400).json({ message: "Instructor is already approved" });
        }

        // Mark instructor as approved
        user.isApproved = true;
        await user.save();

        // Mettre à jour la notification existante
        await Notification.findOneAndUpdate(
            { userId: user._id, type: "approval" },
            {
                message: `Instructor ${user.firstName} ${user.lastName} has been approved.`,
                isRead: false
            },
            { new: true }
        );

        res.status(200).json({ message: "Instructor approved successfully", user });
    } catch (error) {
        console.error("Error approving instructor:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.delete("/notifications", async (req, res) => {
    try {
        await Notification.deleteMany({}); // Deletes all notifications
        res.status(200).json({ message: "All notifications deleted successfully" });
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Disapprove Instructor (Admin only)
router.put("/users/:id/disapprove", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== "instructor") {
            return res.status(400).json({ message: "Only instructors can be disapproved" });
        }

        // Delete the instructor
        await User.findByIdAndDelete(id);

        res.status(200).json({ message: "Instructor disapproved and deleted" });
    } catch (error) {
        console.error("Error disapproving instructor:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Marquer une notification comme lue
router.patch("/notifications/:id/read", async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification non trouvée" });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la notification:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Marquer toutes les notifications comme lues
router.patch("/notifications/read-all", async (req, res) => {
    try {
        await Notification.updateMany(
            { isRead: false },
            { isRead: true }
        );
        res.status(200).json({ message: "Toutes les notifications ont été marquées comme lues" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour des notifications:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Mettre à jour le statut d'un utilisateur
router.patch("/users/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { isApproved },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ 
            message: `Statut de l'utilisateur ${isApproved ? 'activé' : 'désactivé'} avec succès`,
            user: updatedUser 
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Mettre à jour les informations complètes d'un utilisateur
router.put("/users/:id/update", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID
        if (!id || id === 'undefined') {
            return res.status(400).json({ 
                message: "ID d'utilisateur invalide",
                error: "L'ID de l'utilisateur est requis"
            });
        }

        // Validate if ID is a valid MongoDB ObjectId
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                message: "Format d'ID invalide",
                error: "L'ID fourni n'est pas un ID MongoDB valide"
            });
        }

        console.log('Update request received for user:', id);
        console.log('Request body:', req.body);

        // Vérifier si l'utilisateur existe
        const existingUser = await User.findById(id);
        if (!existingUser) {
            console.log('User not found:', id);
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Validate required fields
        if (!req.body.firstName || !req.body.lastName || !req.body.email) {
            console.log('Missing required fields');
            return res.status(400).json({
                message: "Les champs firstName, lastName et email sont obligatoires"
            });
        }

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (req.body.email && req.body.email !== existingUser.email) {
            const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: id } });
            if (emailExists) {
                console.log('Email already in use:', req.body.email);
                return res.status(400).json({ message: "Cet email est déjà utilisé par un autre utilisateur" });
            }
        }

        // Créer l'objet de mise à jour avec seulement les champs valides
        const updateData = {};
        const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'bio', 'profileImage', 'role', 'isApproved'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Preserve existing role and approval status
        updateData.role = existingUser.role;
        updateData.isApproved = existingUser.isApproved;

        console.log('Update data prepared:', updateData);

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!updatedUser) {
            console.log('Update failed for user:', id);
            return res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
        }

        console.log('User updated successfully:', updatedUser._id);
        res.status(200).json({ 
            message: "Informations de l'utilisateur mises à jour avec succès",
            user: updatedUser 
        });
    } catch (error) {
        console.error('Update error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Erreur de validation",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            message: "Erreur serveur lors de la mise à jour",
            error: error.message
        });
    }
});

// Obtenir les informations de l'utilisateur connecté
router.get("/users/profile/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || id === 'undefined') {
            return res.status(400).json({ 
                message: "ID d'utilisateur invalide",
                error: "L'ID de l'utilisateur est requis"
            });
        }

        // Validate if ID is a valid MongoDB ObjectId
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                message: "Format d'ID invalide",
                error: "L'ID fourni n'est pas un ID MongoDB valide"
            });
        }

        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        res.status(500).json({ 
            message: "Erreur serveur lors de la récupération du profil",
            error: error.message 
        });
    }
});

// Get user by ID (Admin only)
router.get("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is a valid MongoDB ObjectId
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                message: "Format d'ID invalide",
                error: "L'ID fourni n'est pas un ID MongoDB valide"
            });
        }

        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Route pour récupérer les instructeurs avec leurs étudiants supervisés
router.get("/instructors-with-students", async (req, res) => {
  try {
    // Récupérer tous les instructeurs
    const instructors = await User.find({ role: "instructor" });

    // Pour chaque instructeur, récupérer les CVs qu'il supervise
    const instructorsWithStudents = await Promise.all(
      instructors.map(async (instructor) => {
        // Récupérer les CVs supervisés par cet instructeur
        const supervisedCVs = await CV.find({
          supervisorId: instructor._id,
        }).populate('userId');

        // Pour chaque CV, récupérer les formations de l'étudiant
        const supervisedStudents = await Promise.all(
          supervisedCVs.map(async (cv) => {
            // Récupérer les formations de l'étudiant
            const enrollments = await Enrollment.find({
              studentId: cv.userId._id,
              status: 'completed'
            }).populate('formationId');

            return {
              student: cv.userId,
              formations: enrollments.map(e => e.formationId),
              supervisionStatus: cv.supervisionStatus,
              supervisionRequestDate: cv.supervisionRequestDate
            };
          })
        );

        // Retourner l'instructeur avec ses étudiants supervisés
        return {
          _id: instructor._id,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          email: instructor.email,
          profileImage: instructor.profileImage,
          supervisedStudents
        };
      })
    );

    res.json(instructorsWithStudents);
  } catch (error) {
    console.error('Error fetching instructors with students:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des instructeurs" });
  }
});

// Get dashboard statistics (Admin only)
router.get("/dashboard-stats", async (req, res) => {
    try {
        // Get total counts
        const [
            totalFormations,
            totalStudents,
            totalInstructors,
            pendingInstructors,
            totalOrders,
            totalEvents
        ] = await Promise.all([
            Formation.countDocuments(),
            User.countDocuments({ role: "student" }),
            User.countDocuments({ role: "instructor", isApproved: true }),
            User.countDocuments({ role: "instructor", isApproved: false }),
            Order.countDocuments(),
            Event.countDocuments()
        ]);

        // Get revenue data from enrollments (like in PaymentManagement)
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

        // Get all enrollments for current and last month
        const [currentMonthEnrollments, lastMonthEnrollments] = await Promise.all([
            Enrollment.find({
                purchaseDate: { $gte: firstDayOfMonth }
            }).populate('formationId'),
            Enrollment.find({
                purchaseDate: {
                    $gte: firstDayOfLastMonth,
                    $lte: lastDayOfLastMonth
                }
            }).populate('formationId')
        ]);

        // Calculate revenue from enrollments (same logic as in PaymentManagement)
        const revenueThisMonth = currentMonthEnrollments.reduce((sum, enrollment) => {
            const price = enrollment.formationId && enrollment.formationId.price ? enrollment.formationId.price : 0;
            return sum + price;
        }, 0);
        
        const revenueLastMonth = lastMonthEnrollments.reduce((sum, enrollment) => {
            const price = enrollment.formationId && enrollment.formationId.price ? enrollment.formationId.price : 0;
            return sum + price;
        }, 0);

        // Get active students (enrolled in at least one formation)
        const activeStudents = await Enrollment.distinct('userId').length;

        // Calculate completion rate
        const completedEnrollments = await Enrollment.countDocuments({ progress: 100 });
        const totalEnrollments = await Enrollment.countDocuments();
        const completionRate = totalEnrollments > 0 
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0;

        // Calculate average rating
        const formations = await Formation.find({ rating: { $exists: true } });
        const totalRating = formations.reduce((sum, formation) => sum + formation.rating, 0);
        const averageRating = formations.length > 0 
            ? Math.round((totalRating / formations.length) * 10) / 10
            : 0;

        res.status(200).json({
            totalFormations,
            totalStudents,
            totalInstructors,
            pendingApprovals: pendingInstructors,
            revenueThisMonth,
            revenueLastMonth,
            activeStudents,
            completionRate,
            averageRating,
            totalEvents
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get e-commerce metrics (Admin only)
router.get("/ecommerce-metrics", async (req, res) => {
    try {
        // Get current date and first day of previous month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

        // Get active students count
        const activeStudents = await User.countDocuments({ 
            role: "student",
            lastLogin: { $gte: firstDayOfMonth }
        });

        // Get previous month's active students
        const previousMonthActiveStudents = await User.countDocuments({
            role: "student",
            lastLogin: {
                $gte: firstDayOfLastMonth,
                $lte: lastDayOfLastMonth
            }
        });

        // Calculate active students change percentage
        const activeStudentsChange = previousMonthActiveStudents > 0
            ? ((activeStudents - previousMonthActiveStudents) / previousMonthActiveStudents) * 100
            : 0;

        // Get available courses count
        const availableCourses = await Formation.countDocuments({ status: "published" });
        const previousMonthCourses = await Formation.countDocuments({
            status: "published",
            createdAt: { $lte: lastDayOfLastMonth }
        });

        // Calculate courses change percentage
        const coursesChange = previousMonthCourses > 0
            ? ((availableCourses - previousMonthCourses) / previousMonthCourses) * 100
            : 0;

        // Get success rate
        const completedCourses = await Enrollment.countDocuments({ progress: 100 });
        const totalEnrollments = await Enrollment.countDocuments();
        const successRate = totalEnrollments > 0
            ? Math.round((completedCourses / totalEnrollments) * 100)
            : 0;

        // Get previous month's success rate
        const previousMonthCompleted = await Enrollment.countDocuments({
            progress: 100,
            updatedAt: {
                $gte: firstDayOfLastMonth,
                $lte: lastDayOfLastMonth
            }
        });
        const previousMonthTotal = await Enrollment.countDocuments({
            createdAt: {
                $gte: firstDayOfLastMonth,
                $lte: lastDayOfLastMonth
            }
        });

        const previousSuccessRate = previousMonthTotal > 0
            ? Math.round((previousMonthCompleted / previousMonthTotal) * 100)
            : 0;

        const successRateChange = previousSuccessRate > 0
            ? successRate - previousSuccessRate
            : 0;

        // Get average rating
        const formations = await Formation.find({ rating: { $exists: true } });
        const totalRating = formations.reduce((sum, formation) => sum + formation.rating, 0);
        const averageRating = formations.length > 0
            ? Math.round((totalRating / formations.length) * 10) / 10
            : 0;

        // Get previous month's average rating
        const previousMonthFormations = await Formation.find({
            rating: { $exists: true },
            updatedAt: {
                $gte: firstDayOfLastMonth,
                $lte: lastDayOfLastMonth
            }
        });
        const previousMonthTotalRating = previousMonthFormations.reduce((sum, formation) => sum + formation.rating, 0);
        const previousMonthAverageRating = previousMonthFormations.length > 0
            ? Math.round((previousMonthTotalRating / previousMonthFormations.length) * 10) / 10
            : 0;

        const averageRatingChange = previousMonthAverageRating > 0
            ? averageRating - previousMonthAverageRating
            : 0;

        res.status(200).json({
            activeStudents: {
                value: activeStudents,
                change: activeStudentsChange
            },
            availableCourses: {
                value: availableCourses,
                change: coursesChange
            },
            successRate: {
                value: successRate,
                change: successRateChange
            },
            averageRating: {
                value: averageRating,
                change: averageRatingChange
            }
        });
    } catch (error) {
        console.error("Error fetching e-commerce metrics:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get dashboard metrics
router.get("/dashboard-metrics", async (req, res) => {
    try {
        // Get current date info
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const lastMonth = new Date(currentDate.setMonth(currentMonth - 1));

        // 1. Étudiants Inscrits
        const [totalStudents, enrolledStudents] = await Promise.all([
            User.countDocuments({ role: "student" }).exec(),
            Enrollment.distinct('studentId').exec()
        ]);

        const enrolledStudentsCount = enrolledStudents.length;
        const enrolledPercentage = totalStudents > 0 ? 
            (enrolledStudentsCount / totalStudents) * 100 : 0;

        // 2. Formations Populaires
        const [totalFormations, formationsWithEnrollments] = await Promise.all([
            Formation.countDocuments().exec(),
            Formation.aggregate([
                {
                    $lookup: {
                        from: "enrollments",
                        localField: "_id",
                        foreignField: "formationId",
                        as: "enrollments"
                    }
                },
                {
                    $match: {
                        "enrollments.0": { $exists: true }
                    }
                }
            ]).exec()
        ]);

        const popularFormationsCount = formationsWithEnrollments.length;
        const popularPercentage = totalFormations > 0 ? 
            (popularFormationsCount / totalFormations) * 100 : 0;

        // 3. Réussite aux Quiz
        const [totalQuizResults, passedQuizResults] = await Promise.all([
            QuizResult.countDocuments().exec(),
            QuizResult.countDocuments({ score: { $gte: 10 } }).exec()
        ]);

        const passRate = totalQuizResults > 0 ? 
            (passedQuizResults / totalQuizResults) * 100 : 0;

        // 4. Note Globale
        const formations = await Formation.find().exec();
        let totalRating = 0;
        let totalFormationsWithRating = 0;

        formations.forEach(formation => {
            // Vérifier si la formation a des étoiles (rating)
            if (formation.rating && typeof formation.rating === 'number') {
                totalRating += formation.rating;
                totalFormationsWithRating++;
            }
        });

        const averageRating = totalFormationsWithRating > 0 ? 
            totalRating / totalFormationsWithRating : 0;

        // Return metrics with safe values
        res.status(200).json({
            purchasedStudents: {
                value: enrolledStudentsCount,
                change: parseFloat(enrolledPercentage.toFixed(1))
            },
            topEnrolledCourses: {
                value: popularFormationsCount,
                change: parseFloat(popularPercentage.toFixed(1))
            },
            quizPassRate: {
                value: parseFloat(passRate.toFixed(1)),
                change: 0
            },
            averageCourseRating: {
                value: parseFloat(averageRating.toFixed(1)),
                change: 0
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        res.status(500).json({ 
            message: "Error fetching dashboard metrics", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Route pour récupérer les métriques mensuelles
router.get('/monthly-metrics', async (req, res) => {
  try {
    // Récupérer les 12 derniers mois
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleString('fr-FR', { month: 'short' })
      });
    }
    
    // Récupérer les données des étudiants inscrits par mois
    const studentData = await Promise.all(months.map(async (month) => {
      const startDate = new Date(month.year, month.month, 1);
      const endDate = new Date(month.year, month.month + 1, 0);
      
      const count = await User.countDocuments({
        role: 'student',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      return count;
    }));
    
    // Récupérer les données des formations créées par mois
    const formationData = await Promise.all(months.map(async (month) => {
      const startDate = new Date(month.year, month.month, 1);
      const endDate = new Date(month.year, month.month + 1, 0);
      
      const count = await Formation.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      return count;
    }));
    
    // Récupérer les données des inscriptions aux formations par mois
    const enrollmentData = await Promise.all(months.map(async (month) => {
      const startDate = new Date(month.year, month.month, 1);
      const endDate = new Date(month.year, month.month + 1, 0);
      
      const count = await Enrollment.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      return count;
    }));
    
    // Formater les données pour le graphique
    const formattedData = {
      labels: months.map(m => m.label),
      studentData,
      formationData,
      enrollmentData
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques mensuelles:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des métriques mensuelles' });
  }
});

// Route pour récupérer les statistiques des événements
router.get('/event-metrics', async (req, res) => {
  try {
    // Récupérer tous les événements
    const events = await Event.find().lean();
    
    // Récupérer tous les participants aux événements
    const participants = await EventParticipant.find().lean();
    
    // Calculer les statistiques
    const totalEvents = events.length;
    const completedEvents = events.filter(event => new Date(event.endDate) < new Date()).length;
    const upcomingEvents = totalEvents - completedEvents;

    // Calculer le taux de participation moyen
    let totalParticipants = participants.length;
    let totalCapacity = 0;
    let upcomingCapacity = 0;

    // Calculer la capacité totale et la capacité des événements à venir
    events.forEach(event => {
      const isUpcoming = new Date(event.endDate) >= new Date();
      const capacity = typeof event.maxParticipants === 'number' && event.maxParticipants > 0 
        ? event.maxParticipants 
        : 10; // Valeur par défaut
      
      totalCapacity += capacity;
      
      if (isUpcoming) {
        upcomingCapacity += capacity;
      }
    });

    // Calculer le taux de participation
    const participationRate = totalCapacity > 0 
      ? Math.round((totalParticipants / totalCapacity) * 100) 
      : 0;

    // Calculer la progression (pourcentage d'événements complétés)
    const progressRate = totalEvents > 0 
      ? Math.round((completedEvents / totalEvents) * 100) 
      : 0;

    // Compter les participants par événement
    const participantsByEvent = {};
    participants.forEach(participant => {
      const eventId = participant.eventId.toString();
      if (!participantsByEvent[eventId]) {
        participantsByEvent[eventId] = 0;
      }
      participantsByEvent[eventId]++;
    });

    // Trouver l'événement avec le plus de participants
    let mostPopularEvent = null;
    let maxParticipants = 0;
    
    Object.keys(participantsByEvent).forEach(eventId => {
      if (participantsByEvent[eventId] > maxParticipants) {
        maxParticipants = participantsByEvent[eventId];
        mostPopularEvent = eventId;
      }
    });

    res.json({
      progressRate,
      participationRate,
      totalEvents,
      completedEvents,
      upcomingEvents,
      totalParticipants,
      totalCapacity,
      upcomingCapacity,
      participantsByEvent,
      mostPopularEvent,
      maxParticipants
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques des événements:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des métriques des événements',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour obtenir les statistiques des formations par catégorie
router.get('/course-categories', async (req, res) => {
  try {
    // Récupérer toutes les formations
    const formations = await Formation.find().lean();
    
    // Initialiser un objet pour compter les formations par catégorie
    const categoryCounts = {};
    
    // Compter les formations par catégorie
    formations.forEach(formation => {
      const category = formation.category || 'Non catégorisé';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Convertir l'objet en tableau pour l'API
    const categories = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    }));
    
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des catégories de formations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour obtenir les formations les plus populaires
router.get('/top-courses', async (req, res) => {
  try {
    // Récupérer toutes les formations avec leurs inscriptions
    const formations = await Formation.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'formationId',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'formationId',
          as: 'orders'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          students: { $size: '$enrollments' },
          revenue: { $sum: '$orders.totalAmount' },
          rating: 1
        }
      },
      {
        $sort: { students: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Calculer la croissance pour chaque formation
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1));

    const formationsWithGrowth = await Promise.all(formations.map(async (formation) => {
      // Calculer le nombre d'étudiants du mois dernier
      const lastMonthStudents = await Enrollment.countDocuments({
        formationId: formation._id,
        createdAt: { $gte: lastMonth }
      });

      // Calculer le pourcentage de croissance
      const growth = lastMonthStudents > 0 
        ? ((formation.students - lastMonthStudents) / lastMonthStudents) * 100 
        : 0;

      return {
        id: formation._id,
        title: formation.title,
        category: formation.category || 'Non catégorisé',
        students: formation.students,
        growth: parseFloat(growth.toFixed(1)),
        revenue: formation.revenue || 0
      };
    }));

    res.json(formationsWithGrowth);
  } catch (error) {
    console.error('Erreur lors de la récupération des formations populaires:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des formations populaires',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour obtenir les inscriptions récentes
router.get('/recent-enrollments', async (req, res) => {
  try {
    // Récupérer les 5 dernières inscriptions avec les informations de la formation et de l'étudiant
    const recentEnrollments = await Enrollment.find()
      .populate({
        path: 'formationId',
        select: 'title duration category price image'
      })
      .populate({
        path: 'studentId',
        select: 'firstName lastName email'
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Formater les données pour le frontend
    const formattedEnrollments = recentEnrollments.map(enrollment => {
      // Déterminer le statut pour l'affichage
      let displayStatus = "En cours";
      if (enrollment.status === "completed") {
        displayStatus = "Terminé";
      } else if (enrollment.status === "rejected") {
        displayStatus = "Annulé";
      }

      return {
        _id: enrollment._id,
        formation: {
          title: enrollment.formationId?.title || 'Formation inconnue',
          duration: enrollment.formationId?.duration || 'Non spécifié',
          category: enrollment.formationId?.category || 'Non catégorisé',
          price: enrollment.formationId?.price ? `${enrollment.formationId.price} DT` : '0 DT',
          image: enrollment.formationId?.image || '/images/formations/default.jpg'
        },
        student: {
          firstName: enrollment.studentId?.firstName || '',
          lastName: enrollment.studentId?.lastName || '',
          email: enrollment.studentId?.email || 'Email non disponible'
        },
        status: displayStatus,
        createdAt: enrollment.createdAt
      };
    });

    res.json(formattedEnrollments);
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions récentes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des inscriptions récentes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
