const QuizResult = require('../models/QuizResult');
const Formation = require('../models/Formation');
const User = require('../models/User');
const mongoose = require('mongoose');

// Obtenir tous les résultats de quiz avec les informations associées
exports.getAllQuizResults = async (req, res) => {
    try {
        const results = await QuizResult.find()
            .populate('formationId', 'title')
            .populate('studentId', 'firstName lastName')
            .populate('instructorId', 'firstName lastName')
            .sort({ completedAt: -1 });
        res.status(200).json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des résultats:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir les statistiques globales des quiz
exports.getQuizStats = async (req, res) => {
    try {
        const results = await QuizResult.find()
            .populate('formationId', 'title');

        // Grouper les résultats par formation
        const stats = results.reduce((acc, result) => {
            const formationTitle = result.formationId?.title || 'Formation inconnue';
            
            if (!acc[formationTitle]) {
                acc[formationTitle] = {
                    formation: formationTitle,
                    totalAttempts: 0,
                    totalScore: 0,
                    passCount: 0
                };
            }

            acc[formationTitle].totalAttempts++;
            acc[formationTitle].totalScore += result.score;
            if (result.status === 'Réussi') {
                acc[formationTitle].passCount++;
            }

            return acc;
        }, {});

        // Calculer les moyennes et taux de réussite
        const formattedStats = Object.values(stats).map(stat => ({
            formation: stat.formation,
            averageScore: stat.totalScore / stat.totalAttempts,
            passRate: (stat.passCount / stat.totalAttempts) * 100,
            totalAttempts: stat.totalAttempts,
            passCount: stat.passCount
        }));

        res.status(200).json(formattedStats);
    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Enregistrer un nouveau résultat de quiz
exports.saveQuizResult = async (req, res) => {
  try {
    const { formationId } = req.params;
    const { quizId, score, answers, totalQuestions, correctAnswers, quizTitle } = req.body;
    const studentId = req.user._id;

    // Vérifier si la formation existe et récupérer l'ID de l'instructeur
    const formation = await Formation.findById(formationId);
    if (!formation) {
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    // Vérifier si l'étudiant n'a pas déjà complété ce quiz
    const existingResult = await QuizResult.findOne({
      formationId,
      quizId,
      studentId
    });

    if (existingResult) {
      return res.status(400).json({ message: 'Vous avez déjà complété ce quiz' });
    }

    // Créer le nouveau résultat
    const quizResult = new QuizResult({
      quizId,
      formationId,
      studentId,
      instructorId: formation.instructor,
      quizTitle,
      score,
      totalQuestions,
      correctAnswers,
      answers,
      status: score >= 10 ? 'Réussi' : 'Échoué'
    });

    await quizResult.save();

    res.status(201).json({
      message: 'Résultat enregistré avec succès',
      result: quizResult
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du résultat:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les résultats d'un étudiant pour une formation
exports.getStudentResults = async (req, res) => {
  try {
    const { formationId } = req.params;
    const studentId = req.user._id;

    const results = await QuizResult.find({ formationId, studentId })
      .populate('quizId', 'title')
      .sort('-completedAt');

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les résultats pour une formation (pour l'instructeur)
exports.getFormationResults = async (req, res) => {
  try {
    const { formationId } = req.params;
    const formation = await Formation.findById(formationId);

    // Vérifier si l'utilisateur est l'instructeur de la formation
    if (formation.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const results = await QuizResult.find({ formationId })
      .populate('studentId', 'name email')
      .populate('quizId', 'title')
      .sort('-completedAt');

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques des quiz pour une formation
exports.getFormationQuizStats = async (req, res) => {
  try {
    const { formationId } = req.params;

    const stats = await QuizResult.aggregate([
      { $match: { formationId: mongoose.Types.ObjectId(formationId) } },
      {
        $group: {
          _id: '$quizId',
          averageScore: { $avg: '$score' },
          totalAttempts: { $sum: 1 },
          successCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Réussi'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          averageScore: { $round: ['$averageScore', 2] },
          totalAttempts: 1,
          successCount: 1,
          successRate: {
            $round: [
              { $multiply: [{ $divide: ['$successCount', '$totalAttempts'] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 