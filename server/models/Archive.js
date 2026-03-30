const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['event', 'formation', 'enrollment', 'cv']
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  archivedAt: {
    type: Date,
    default: Date.now
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

// Index pour améliorer les performances des recherches
archiveSchema.index({ type: 1, archivedAt: -1 });
archiveSchema.index({ originalId: 1 });
archiveSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Archive', archiveSchema); 