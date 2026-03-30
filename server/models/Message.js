const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'expéditeur est requis']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le destinataire est requis']
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  attachments: [{
    filename: {
      type: String,
      required: [true, 'Le nom du fichier est requis']
    },
    path: {
      type: String,
      required: [true, 'Le chemin du fichier est requis']
    },
    mimetype: {
      type: String,
      required: [true, 'Le type MIME est requis']
    }
  }],
  cvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CV',
    required: [true, 'L\'ID du CV est requis']
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Middleware pre-save pour validation
messageSchema.pre('save', async function(next) {
  try {
    // Vérifier qu'il y a soit du contenu, soit des pièces jointes
    if (!this.content && (!this.attachments || this.attachments.length === 0)) {
      throw new Error('Le message doit contenir du texte ou des pièces jointes');
    }

    // Vérifier que l'expéditeur et le destinataire existent
    const User = mongoose.model('User');
    const [sender, recipient] = await Promise.all([
      User.findById(this.sender),
      User.findById(this.recipient)
    ]);

    if (!sender) {
      throw new Error('L\'expéditeur n\'existe pas');
    }
    if (!recipient) {
      throw new Error('Le destinataire n\'existe pas');
    }

    // Vérifier que le CV existe et que la supervision est acceptée
    const CV = mongoose.model('CV');
    const cv = await CV.findById(this.cvId);
    if (!cv) {
      throw new Error('Le CV n\'existe pas');
    }
    if (cv.supervisionStatus !== 'accepted') {
      throw new Error('La supervision doit être acceptée pour pouvoir échanger des messages');
    }

    // Vérifier que l'expéditeur et le destinataire sont bien l'étudiant et le superviseur du CV
    const isValidParticipants = (
      (this.sender.equals(cv.userId) && this.recipient.equals(cv.supervisorId)) ||
      (this.sender.equals(cv.supervisorId) && this.recipient.equals(cv.userId))
    );
    if (!isValidParticipants) {
      throw new Error('Les participants ne correspondent pas à l\'étudiant et au superviseur du CV');
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier si l'utilisateur peut accéder au message
messageSchema.methods.canAccess = function(userId) {
  return this.sender.equals(userId) || this.recipient.equals(userId);
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 