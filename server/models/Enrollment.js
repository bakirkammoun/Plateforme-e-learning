const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  formationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
enrollmentSchema.index({ studentId: 1, formationId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema); 