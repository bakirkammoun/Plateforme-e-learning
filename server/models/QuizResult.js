const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  formationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'L\'ID de l\'instructeur est requis'],
    ref: 'User'
  },
  quizTitle: {
    type: String,
    required: [true, 'Le titre du quiz est requis']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Le nombre total de questions est requis'],
    min: [1, 'Il doit y avoir au moins une question']
  },
  correctAnswers: {
    type: Number,
    required: [true, 'Le nombre de réponses correctes est requis'],
    min: [0, 'Le nombre de réponses correctes ne peut pas être négatif'],
    validate: {
      validator: function(v) {
        return v <= this.totalQuestions;
      },
      message: 'Le nombre de réponses correctes ne peut pas dépasser le nombre total de questions'
    }
  },
  answers: [{
    question: String,
    userAnswer: Number,
    correctAnswer: Number,
    isCorrect: Boolean
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Réussi', 'Échoué'],
      message: 'Le statut doit être soit "Réussi" soit "Échoué"'
    },
    required: [true, 'Le statut est requis']
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
quizResultSchema.index({ formationId: 1, studentId: 1, quizId: 1 }, { unique: true });

// Middleware pre-save pour validation supplémentaire
quizResultSchema.pre('save', function(next) {
  // Vérifier que le score correspond au nombre de réponses correctes
  const expectedScore = (this.correctAnswers / this.totalQuestions) * 20;
  if (Math.abs(this.score - expectedScore) > 0.01) { // Permettre une petite marge d'erreur pour les nombres flottants
    next(new Error('Le score ne correspond pas au nombre de réponses correctes'));
    return;
  }

  // Vérifier que le nombre de réponses correspond au nombre total de questions
  if (this.answers.length !== this.totalQuestions) {
    next(new Error('Le nombre de réponses ne correspond pas au nombre total de questions'));
    return;
  }

  // Vérifier que le statut correspond au score
  const shouldPass = this.score >= 10;
  if ((shouldPass && this.status !== 'Réussi') || (!shouldPass && this.status !== 'Échoué')) {
    next(new Error('Le statut ne correspond pas au score'));
    return;
  }

  next();
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

module.exports = QuizResult; 