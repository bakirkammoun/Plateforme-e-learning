const express = require("express");
const Formation = require("../models/Formation");
const mongoose = require("mongoose");
const router = express.Router();
const QuizResult = require("../models/QuizResult");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Enrollment = require("../models/Enrollment");

// Récupérer tous les quiz de toutes les formations
router.get("/quiz/all", async (req, res) => {
    try {
        const formations = await Formation.find({}, 'title quizzes');
        const allQuizzes = formations.reduce((acc, formation) => {
            return acc.concat(
                formation.quizzes.map(quiz => ({
                    ...quiz.toObject(),
                    formationTitle: formation.title,
                    formationId: formation._id
                }))
            );
        }, []);
        
        res.status(200).json(allQuizzes);
    } catch (error) {
        console.error("Erreur lors de la récupération des quiz:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Récupérer toutes les formations
router.get("/", auth, async (req, res) => {
    try {
        const { isArchived } = req.query;
        
        // Construire la requête
        const query = { 
            instructorId: req.user._id,
            // Par défaut, ne montrer que les formations non archivées
            isArchived: isArchived === 'true' ? true : false
        };

        console.log('Critères de recherche:', query);

        const formations = await Formation.find(query)
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        console.log(`${formations.length} formations trouvées`);
        
        res.status(200).json(formations);
    } catch (error) {
        console.error("Erreur lors de la récupération des formations:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Récupérer une formation par ID
router.get("/:id", async (req, res) => {
    try {
        const formation = await Formation.findById(req.params.id)
            .populate('instructorId', 'firstName lastName email')
            .populate('enrolledStudents', 'firstName lastName email');
        
        if (!formation) {
            return res.status(404).json({ message: "Formation non trouvée" });
        }
        
        res.status(200).json(formation);
    } catch (error) {
        console.error("Erreur lors de la récupération de la formation:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Créer une nouvelle formation
router.post("/", async (req, res) => {
    try {
        const { title, description, category, level, price, duration, image, instructorId } = req.body;

        // Validation des champs requis
        if (!title || !description || !category || !level || !price || !duration || !image || !instructorId) {
            return res.status(400).json({ 
                message: "Tous les champs sont obligatoires",
                received: req.body
            });
        }

        // Création de la formation
        const formation = new Formation({
            title,
            description,
            category,
            level,
            price: Number(price),
            duration: Number(duration),
            image,
            instructorId,
            videos: []
        });

        const savedFormation = await formation.save();

        // Récupérer les informations de l'instructeur
        const instructor = await User.findById(instructorId);

        // Créer une notification pour les administrateurs
        const notification = new Notification({
            recipientRole: 'admin',
            sender: instructorId,
            type: 'course_added',
            message: `${instructor.firstName} ${instructor.lastName} a ajouté un nouveau cours : ${title}`,
            data: {
                courseId: savedFormation._id,
                courseTitle: title,
                instructorId: instructorId,
                instructorName: `${instructor.firstName} ${instructor.lastName}`
            }
        });

        await notification.save();

        res.status(201).json(savedFormation);
    } catch (error) {
        console.error("Erreur création formation:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message
        });
    }
});

// Mettre à jour une formation
router.put("/:id", async (req, res) => {
    try {
        const updatedFormation = await Formation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!updatedFormation) {
            return res.status(404).json({ message: "Formation non trouvée" });
        }
        
        res.status(200).json(updatedFormation);
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la formation:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Route pour archiver une formation
router.post("/:id/archive", auth, async (req, res) => {
    try {
        console.log('Tentative d\'archivage de formation:', req.params.id);

        const formation = await Formation.findOneAndUpdate(
            {
                _id: req.params.id,
                instructorId: req.user._id
            },
            {
                $set: {
                    isArchived: true,
                    archivedAt: new Date()
                }
            },
            { new: true }
        );

        if (!formation) {
            return res.status(404).json({ 
                message: "Formation non trouvée ou vous n'êtes pas autorisé à l'archiver" 
            });
        }

        console.log('Formation archivée avec succès:', {
            id: formation._id,
            title: formation.title
        });

        res.json({ 
            message: "Formation archivée avec succès",
            formation: {
                id: formation._id,
                title: formation.title
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
        res.status(500).json({
            message: "Erreur lors de l'archivage de la formation",
            error: error.message
        });
    }
});

// Route pour supprimer définitivement une formation
router.delete("/:id/permanent", auth, async (req, res) => {
    try {
        console.log('Tentative de suppression permanente de formation:', req.params.id);

        // Vérifier d'abord si la formation existe et appartient à l'instructeur
        const formation = await Formation.findOne({
            _id: req.params.id,
            instructorId: req.user._id
        });

        if (!formation) {
            return res.status(404).json({ 
                message: "Formation non trouvée ou vous n'êtes pas autorisé à la supprimer" 
            });
        }

        // Supprimer définitivement la formation
        await Formation.findByIdAndDelete(req.params.id);

        console.log('Formation supprimée définitivement:', {
            id: formation._id,
            title: formation.title
        });

        res.json({ 
            message: "Formation supprimée définitivement",
            formation: {
                id: formation._id,
                title: formation.title
            }
        });
    } catch (error) {
        console.error('Erreur lors de la suppression permanente:', error);
        res.status(500).json({
            message: "Erreur lors de la suppression de la formation",
            error: error.message
        });
    }
});

// Mettre à jour le statut d'une formation
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const formation = await Formation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!formation) {
            return res.status(404).json({ message: "Formation non trouvée" });
        }
        
        res.status(200).json(formation);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Inscrire un étudiant à une formation
router.post("/:id/enroll", async (req, res) => {
    try {
        const { studentId } = req.body;
        const formation = await Formation.findById(req.params.id);
        
        if (!formation) {
            return res.status(404).json({ message: "Formation non trouvée" });
        }
        
        if (formation.enrolledStudents.includes(studentId)) {
            return res.status(400).json({ message: "Étudiant déjà inscrit" });
        }
        
        formation.enrolledStudents.push(studentId);
        await formation.save();
        
        res.status(200).json(formation);
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Noter une formation
router.post("/:id/rate", async (req, res) => {
    try {
        const { rating } = req.body;
        const formation = await Formation.findById(req.params.id);
        
        if (!formation) {
            return res.status(404).json({ message: "Formation non trouvée" });
        }
        
        const newRating = (formation.rating * formation.numberOfRatings + rating) / (formation.numberOfRatings + 1);
        formation.rating = newRating;
        formation.numberOfRatings += 1;
        
        await formation.save();
        
        res.status(200).json(formation);
    } catch (error) {
        console.error("Erreur lors de la notation:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Récupérer les formations d'un instructeur spécifique
router.get("/instructor/:instructorId", async (req, res) => {
    try {
        const formations = await Formation.find({ instructorId: req.params.instructorId })
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json(formations);
    } catch (error) {
        console.error("Erreur lors de la récupération des formations de l'instructeur:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des formations", 
            error: error.message 
        });
    }
});

// Récupérer les formations d'un étudiant spécifique
router.get("/student/:studentId", async (req, res) => {
    try {
        const formations = await Formation.find({ 
            enrolledStudents: req.params.studentId 
        })
        .populate('instructorId', 'firstName lastName email')
        .sort({ createdAt: -1 });
        
        res.status(200).json(formations);
    } catch (error) {
        console.error("Erreur lors de la récupération des formations de l'étudiant:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des formations", 
            error: error.message 
        });
    }
});

// Récupérer la dernière formation d'un instructeur
router.get("/instructor/:instructorId/last", async (req, res) => {
    try {
        const formation = await Formation.findOne({ instructorId: req.params.instructorId })
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        if (!formation) {
            return res.status(404).json({ message: "Aucune formation trouvée pour cet instructeur" });
        }
        
        res.status(200).json(formation);
    } catch (error) {
        console.error("Erreur lors de la récupération de la dernière formation:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération de la dernière formation", 
            error: error.message 
        });
    }
});

// Récupérer la dernière formation d'un instructeur avec sa vidéo
router.get("/instructor/:instructorId/last-with-video", async (req, res) => {
    try {
        const formation = await Formation.findOne({ 
            instructorId: req.params.instructorId,
            'videos.0': { $exists: true } // Vérifie qu'il y a au moins une vidéo
        })
        .populate('instructorId', 'firstName lastName email')
        .sort({ createdAt: -1 });
        
        if (!formation) {
            return res.status(404).json({ 
                message: "Aucune formation avec vidéo trouvée pour cet instructeur" 
            });
        }
        
        // Extraire la première vidéo pour faciliter l'accès côté client
        const firstVideo = formation.videos && formation.videos.length > 0 ? formation.videos[0] : null;
        
        // Préparer la réponse avec les informations essentielles
        const response = {
            id: formation._id,
            title: formation.title,
            description: formation.description,
            image: formation.image,
            createdAt: formation.createdAt,
            instructor: formation.instructorId,
            video: firstVideo
        };
        
        res.status(200).json(response);
    } catch (error) {
        console.error("Erreur lors de la récupération de la dernière formation avec vidéo:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération de la dernière formation avec vidéo", 
            error: error.message 
        });
    }
});

// Route pour compter les formations par catégorie
router.get('/count-by-category', async (req, res) => {
  try {
    console.log('Début du comptage des formations par catégorie');

    // Initialiser les compteurs
    const result = {
      languages: 0,
      computerScience: 0,
      competitions: 0
    };

    // Récupérer toutes les formations avec seulement le champ category
    const formations = await Formation.find({}, 'category');
    console.log('Formations trouvées:', formations.length);
    console.log('Catégories présentes:', formations.map(f => f.category));

    // Compter manuellement les formations par catégorie
    formations.forEach(formation => {
      switch(formation.category) {
        case 'Langues':
          result.languages++;
          break;
        case 'Informatique':
          result.computerScience++;
          break;
        case 'Concours et Formation Scolaire':
          result.competitions++;
          break;
        default:
          console.log('Catégorie inconnue trouvée:', formation.category);
      }
    });

    console.log('Résultat final:', result);
    res.json(result);

  } catch (error) {
    console.error('Erreur détaillée lors du comptage des formations:', error);
    console.error('Stack trace:', error.stack);
    
    // Vérifier l'état de la connexion
    const connectionState = mongoose.connection.readyState;
    console.error('État de la connexion MongoDB:', connectionState);
    
    res.status(500).json({ 
      message: "Erreur lors du comptage des formations", 
      error: error.message,
      mongoState: connectionState,
      details: 'Vérifiez que MongoDB est en cours d\'exécution et que la connexion est établie'
    });
  }
});

// Récupérer les formations par catégorie
router.get('/by-category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    let query = {};

    // Définir la requête en fonction de la catégorie
    switch(category) {
      case 'computerScience':
        query = { category: 'Informatique' };
        break;
      case 'languages':
        query = { category: 'Langues' };
        break;
      case 'competitions':
        query = { category: 'Concours et Formation Scolaire' };
        break;
      default:
        query = { category };
    }

    const formations = await Formation.find(query)
      .populate('instructorId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json(formations);
  } catch (error) {
    console.error("Erreur lors de la récupération des formations par catégorie:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
});

// Ajouter une route pour les résultats de quiz
router.post('/:id/quiz-results', auth, async (req, res) => {
  try {
    console.log('=== Début du traitement des résultats du quiz ===');
    console.log('Body reçu:', JSON.stringify(req.body, null, 2));
    console.log('Params:', req.params);
    console.log('User:', req.user);

    // Vérification de l'existence de la formation
    const formation = await Formation.findById(req.params.id);
    if (!formation) {
      console.error('Formation non trouvée:', req.params.id);
      return res.status(404).json({
        message: 'Formation non trouvée'
      });
    }

    // Extraction et conversion des données
    const quizData = {
      quizId: new mongoose.Types.ObjectId(req.body.quizId),
      formationId: new mongoose.Types.ObjectId(req.params.id),
      studentId: new mongoose.Types.ObjectId(req.user._id),
      instructorId: new mongoose.Types.ObjectId(formation.instructorId),
      quizTitle: req.body.quizTitle || 'Quiz sans titre',
      score: Number(req.body.score),
      totalQuestions: Number(req.body.totalQuestions),
      correctAnswers: Number(req.body.correctAnswers),
      answers: req.body.answers.map(answer => ({
        question: String(answer.question),
        userAnswer: String(answer.userAnswer),
        correctAnswer: String(answer.correctAnswer),
        isCorrect: Boolean(answer.isCorrect)
      })),
      status: req.body.status
    };

    console.log('=== Données converties ===');
    console.log(JSON.stringify(quizData, null, 2));

    // Création du résultat du quiz
    const quizResult = new QuizResult(quizData);

    // Validation manuelle avant sauvegarde
    const validationError = quizResult.validateSync();
    if (validationError) {
      console.error('Erreur de validation:', validationError);
      return res.status(400).json({
        message: 'Données invalides',
        errors: Object.values(validationError.errors).map(error => ({
          field: error.path,
          message: error.message
        }))
      });
    }

    // Sauvegarde du résultat
    await quizResult.save();

    // Créer une notification pour les admins
    const notification = new Notification({
      type: 'quiz_completed',
      message: `${req.user.firstName} ${req.user.lastName} a terminé le quiz "${quizData.quizTitle}" avec un score de ${quizData.score}/20 (${quizData.status})`,
      recipientRole: 'admin',
      sender: req.user._id,
      data: {
        quizId: quizData.quizId,
        formationId: quizData.formationId,
        studentId: quizData.studentId,
        score: quizData.score,
        status: quizData.status,
        studentName: `${req.user.firstName} ${req.user.lastName}`,
        formationTitle: formation.title,
        quizTitle: quizData.quizTitle,
        correctAnswers: quizData.correctAnswers,
        totalQuestions: quizData.totalQuestions
      }
    });

    await notification.save();

    res.status(201).json({
      message: 'Résultat du quiz enregistré avec succès',
      quizResult
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du résultat:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'enregistrement du résultat',
      error: error.message
    });
  }
});

// Récupérer les résultats de quiz d'une formation
router.get("/:id/quiz-results", auth, async (req, res) => {
    try {
        const formation = await Formation.findById(req.params.id);
        if (!formation) {
            return res.status(404).json({ message: "Formation non trouvée" });
        }

        const results = await QuizResult.find({ formationId: req.params.id })
            .populate('formationId', 'title')
            .populate('studentId', 'firstName lastName')
            .populate('instructorId', 'firstName lastName')
            .sort({ completedAt: -1 });

        res.status(200).json(results);
    } catch (error) {
        console.error("Erreur lors de la récupération des résultats:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
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

    // Vérifier si l'utilisateur est authentifié
    const token = req.headers.authorization?.split(' ')[1];
    let isEnrolled = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isEnrolled = formation.enrolledStudents.includes(decoded.id);
      } catch (error) {
        console.log('Token invalide ou expiré:', error.message);
      }
    }

    console.log('Formation trouvée:', {
      id: formation._id,
      title: formation.title,
      status: formation.status,
      isEnrolled
    });

    res.json({
      message: 'Formation trouvée',
      formation: {
        id: formation._id,
        title: formation.title,
        status: formation.status,
        isEnrolled
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

// Route pour s'inscrire à une formation (alias pour /enroll)
router.post("/:id/register", auth, async (req, res) => {
    try {
        // Vérification de l'authentification
        if (!req.user) {
            console.error('Aucun utilisateur trouvé dans la requête');
            return res.status(401).json({
                message: 'Non authentifié',
                error: 'Aucun utilisateur trouvé dans la requête'
            });
        }

        const formationId = req.params.id;
        const userId = req.user._id || req.user.id;

        console.log('=== Début de la tentative d\'inscription ===');
        console.log('Headers:', req.headers);
        console.log('User object complet:', JSON.stringify(req.user, null, 2));
        console.log('Formation ID:', formationId);
        console.log('User ID:', userId);
        console.log('User ID type:', typeof userId);

        // Vérification du format des IDs
        if (!mongoose.Types.ObjectId.isValid(formationId)) {
            console.error('Format d\'ID de formation invalide:', formationId);
            return res.status(400).json({
                message: 'ID de formation invalide',
                error: 'Format d\'ID incorrect',
                receivedId: formationId
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Format d\'ID utilisateur invalide:', userId);
            return res.status(400).json({
                message: 'ID utilisateur invalide',
                error: 'Format d\'ID utilisateur incorrect',
                receivedUserId: userId,
                userIdType: typeof userId
            });
        }

        // Vérification de l'existence de la formation
        const formation = await Formation.findById(formationId);
        if (!formation) {
            console.error('Formation non trouvée:', formationId);
            return res.status(404).json({
                message: 'Formation non trouvée',
                error: 'Aucune formation avec cet ID',
                formationId
            });
        }

        // Vérification de l'existence de l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
            console.error('Utilisateur non trouvé:', userId);
            return res.status(404).json({
                message: 'Utilisateur non trouvé',
                error: 'L\'utilisateur n\'existe pas',
                userId
            });
        }

        // Vérification de l'inscription existante
        if (formation.enrolledStudents.includes(userId)) {
            console.log('Utilisateur déjà inscrit:', userId);
            return res.status(400).json({
                message: 'Vous êtes déjà inscrit à cette formation',
                error: 'Inscription existante',
                userId,
                formationId
            });
        }

        // Mise à jour de la formation
        formation.enrolledStudents.push(userId);
        await formation.save();
        console.log('Étudiant ajouté à la formation');

        // Mise à jour de l'utilisateur
        if (!user.enrolledFormations) {
            user.enrolledFormations = [];
        }
        user.enrolledFormations.push(formationId);
        await user.save();
        console.log('Formation ajoutée au profil de l\'utilisateur');

        res.status(200).json({
            message: 'Inscription réussie',
            formation: {
                id: formation._id,
                title: formation.title,
                enrolledAt: new Date()
            }
        });

    } catch (error) {
        console.error('Erreur détaillée lors de l\'inscription:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            path: error.path,
            value: error.value,
            user: req.user,
            formationId: req.params.id,
            headers: req.headers
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Erreur de validation',
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Format de données invalide',
                error: `Erreur pour le champ ${error.path}: ${error.value}`,
                details: error.message
            });
        }

        res.status(500).json({
            message: 'Erreur lors de l\'inscription à la formation',
            error: error.message
        });
    }
});

// Route pour obtenir les résultats des quiz des étudiants
router.get('/instructor/:instructorId/quiz-results', async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Vérifier si l'instructeur existe
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Instructeur non trouvé' });
    }

    // Récupérer les formations de l'instructeur
    const formations = await Formation.find({ instructorId });
    if (!formations.length) {
      return res.status(200).json([]); // Retourner un tableau vide si aucune formation
    }

    const formationIds = formations.map(f => f._id);

    // Récupérer les résultats de quiz pour ces formations
    const quizResults = await QuizResult.find({
      formationId: { $in: formationIds }
    })
    .populate('studentId', 'firstName lastName email profileImage')
    .populate('formationId', 'title')
    .sort({ submittedAt: -1 });

    // Formater les résultats pour l'affichage
    const formattedResults = quizResults.map(result => ({
      studentName: result.studentId ? `${result.studentId.firstName} ${result.studentId.lastName}` : 'Étudiant inconnu',
      studentImage: result.studentId?.profileImage || '/assets/images/avatar/default-avatar.png',
      quizName: result.quizTitle || 'Quiz sans titre',
      score: result.score || 0,
      date: result.submittedAt || new Date(),
      formationTitle: result.formationId?.title || 'Formation inconnue'
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats des quiz:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des résultats des quiz',
      error: error.message 
    });
  }
});

// Route pour calculer le nombre total d'heures des formations suivies
router.get("/user/:userId/total-hours", auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Vérifier si l'utilisateur est autorisé à accéder à ces données
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: "Non autorisé à accéder à ces données" 
            });
        }

        // Récupérer toutes les inscriptions approuvées de l'utilisateur
        const enrollments = await Enrollment.find({
            studentId: userId,
            status: 'approved'
        }).populate('formationId', 'duration title');

        console.log('Inscriptions trouvées:', enrollments.length);

        // Calculer le nombre total d'heures
        const totalHours = enrollments.reduce((sum, enrollment) => {
            if (enrollment.formationId && enrollment.formationId.duration) {
                console.log(`Formation "${enrollment.formationId.title}": ${enrollment.formationId.duration} heures`);
                return sum + enrollment.formationId.duration;
            }
            return sum;
        }, 0);

        console.log('Nombre total d\'heures:', totalHours);

        res.status(200).json({ 
            totalHours,
            formationsCount: enrollments.length,
            formations: enrollments.map(e => ({
                title: e.formationId.title,
                duration: e.formationId.duration,
                progress: e.progress || 0
            }))
        });
    } catch (error) {
        console.error("Erreur lors du calcul des heures totales:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
});

// Route pour obtenir le nombre de formations ratées
router.get('/user/:userId/failed-count', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Vérifier l'autorisation
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Récupérer les formations ratées (celles avec un statut 'failed')
    const failedFormations = await Formation.find({
      'enrollments.user': userId,
      'enrollments.status': 'failed'
    });

    res.json({
      count: failedFormations.length,
      formations: failedFormations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations ratées:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir le nombre de formations achetées
router.get('/user/:userId/purchased-count', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Vérifier l'autorisation
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Récupérer les inscriptions approuvées de l'utilisateur
    const enrollments = await Enrollment.find({
      studentId: userId,
      status: 'approved'
    }).populate('formationId', 'title duration');

    console.log('Nombre d\'inscriptions approuvées trouvées:', enrollments.length);

    res.json({
      count: enrollments.length,
      formations: enrollments.map(e => ({
        title: e.formationId.title,
        duration: e.formationId.duration,
        progress: e.progress || 0
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations achetées:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer les résultats des quiz d'un utilisateur
router.get('/student/:userId/quiz-results', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Vérifier l'autorisation
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Récupérer les résultats des quiz de l'étudiant
    const quizResults = await QuizResult.find({
      studentId: userId
    })
    .populate('formationId', 'title image')
    .populate('instructorId', 'firstName lastName')
    .sort({ submittedAt: -1 });

    // Formater les résultats pour l'affichage
    const formattedResults = quizResults.map(result => ({
      formationTitle: result.formationId?.title || 'Formation inconnue',
      formationImage: result.formationId?.image || 'assets/images/thumbs/testimonial-img1.png',
      quizTitle: result.quizTitle || 'Quiz sans titre',
      score: result.score || 0,
      correctAnswers: result.correctAnswers || 0,
      totalQuestions: result.totalQuestions || 0,
      timeSpent: result.timeSpent || 0,
      completedAt: result.submittedAt || new Date(),
      instructorName: result.instructorId ? `${result.instructorId.firstName} ${result.instructorId.lastName}` : 'Instructeur inconnu'
    }));

    console.log(`Résultats des quiz récupérés pour l'étudiant ${userId}: ${formattedResults.length} résultats`);
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats des quiz:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des résultats des quiz',
      error: error.message 
    });
  }
});

// Route pour récupérer les formations archivées
router.get("/archived", auth, async (req, res) => {
    try {
        console.log('Tentative de récupération des formations archivées');
        console.log('User ID:', req.user._id);

        // Vérifier que l'utilisateur est connecté
        if (!req.user || !req.user._id) {
            console.log('Utilisateur non authentifié');
            return res.status(401).json({ message: "Non authentifié" });
        }

        // Récupérer les formations archivées
        const formations = await Formation.find({
            instructorId: req.user._id,
            isArchived: true
        }).sort({ archivedAt: -1 });

        console.log(`Formations archivées trouvées: ${formations.length}`);
        
        res.json(formations);
    } catch (error) {
        console.error('Erreur lors de la récupération des formations archivées:', error);
        res.status(500).json({
            message: "Erreur lors de la récupération des formations archivées",
            error: error.message
        });
    }
});

// Route pour restaurer une formation archivée
router.put("/:id/restore", auth, async (req, res) => {
    try {
        console.log('Tentative de restauration de formation:', req.params.id);

        // Vérifier et restaurer la formation en une seule opération
        const formation = await Formation.findOneAndUpdate(
            {
                _id: req.params.id,
                instructorId: req.user._id,
                isArchived: true
            },
            {
                $set: {
                    isArchived: false,
                    archivedAt: null
                }
            },
            { new: true }
        );

        if (!formation) {
            return res.status(404).json({ 
                message: "Formation non trouvée ou déjà restaurée" 
            });
        }

        console.log('Formation restaurée avec succès:', formation._id);

        res.json({ 
            message: "Formation restaurée avec succès",
            formation: {
                id: formation._id,
                title: formation.title
            }
        });
    } catch (error) {
        console.error('Erreur lors de la restauration:', error);
        res.status(500).json({
            message: "Erreur lors de la restauration de la formation",
            error: error.message
        });
    }
});

module.exports = router; 