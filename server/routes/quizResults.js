const express = require('express');
const router = express.Router();
const quizResultController = require('../controllers/quizResultController');
const auth = require('../middleware/auth');
const QuizResult = require('../models/QuizResult');

// Routes publiques
router.post('/', auth, quizResultController.saveQuizResult);

// Routes protégées
router.get('/all', auth, async (req, res) => {
    try {
        const results = await QuizResult.find()
            .populate('formationId', 'title image')
            .populate('studentId', 'firstName lastName')
            .populate('instructorId', 'firstName lastName')
            .sort({ submittedAt: -1 });
        
        console.log('Résultats trouvés:', results.length);
        res.status(200).json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des résultats:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route pour récupérer les résultats de quiz d'un étudiant spécifique
router.get('/student-results/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Vérifier l'autorisation
        if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const results = await QuizResult.find({ studentId })
            .populate('formationId', 'title image')
            .populate('studentId', 'firstName lastName')
            .populate('instructorId', 'firstName lastName')
            .sort({ submittedAt: -1 });

        console.log(`Résultats trouvés pour l'étudiant ${studentId}:`, results.length);
        res.status(200).json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des résultats:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

router.get('/stats', auth, quizResultController.getQuizStats);
router.get('/formation/:formationId', auth, quizResultController.getFormationResults);
router.get('/formation/:formationId/stats', auth, quizResultController.getFormationQuizStats);
router.get('/formation-student/:formationId', auth, quizResultController.getStudentResults);

module.exports = router; 