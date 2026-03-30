const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true // Un utilisateur ne peut avoir qu'un seul CV
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  supervisionStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  supervisionRequestDate: {
    type: Date,
    default: null
  },
  supervisionResponseDate: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  technicalSkills: {
    type: String,
    default: ''
  },
  softSkills: {
    type: String,
    default: ''
  },
  languages: {
    type: String,
    default: ''
  },
  workExperience: {
    type: [{
      title: { type: String, default: '' },
      company: { type: String, default: '' },
      location: { type: String, default: '' },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      description: { type: String, default: '' }
    }],
    default: []
  },
  education: {
    type: [{
      degree: { type: String, default: '' },
      institution: { type: String, default: '' },
      location: { type: String, default: '' },
      graduationDate: { type: String, default: '' },
      gpa: { type: String, default: '' }
    }],
    default: []
  },
  projects: {
    type: [{
      name: { type: String, default: '' },
      technologies: { type: String, default: '' },
      description: { type: String, default: '' },
      link: { type: String, default: '' }
    }],
    default: []
  },
  certifications: {
    type: [{
      name: { type: String, default: '' },
      issuer: { type: String, default: '' },
      date: { type: String, default: '' },
      link: { type: String, default: '' }
    }],
    default: []
  }
}, {
  timestamps: true,
  strict: true,
  collection: 'cvs'
});

// Middleware pre-save pour s'assurer que les tableaux ne sont jamais null
cvSchema.pre('save', function(next) {
  if (!this.workExperience) this.workExperience = [];
  if (!this.education) this.education = [];
  if (!this.projects) this.projects = [];
  if (!this.certifications) this.certifications = [];
  next();
});

// Supprimer les anciens index qui pourraient causer des problèmes
cvSchema.on('index', function(error) {
  if (error) {
    console.error('Erreur d\'index CV:', error);
  }
});

const CV = mongoose.model('CV', cvSchema);

// Supprimer l'index problématique s'il existe
CV.collection.dropIndex('cvId_1')
  .then(() => console.log('Index cvId_1 supprimé avec succès'))
  .catch(err => {
    if (err.code !== 27) { // 27 est le code pour "index not found"
      console.error('Erreur lors de la suppression de l\'index:', err);
    }
  });

module.exports = CV; 