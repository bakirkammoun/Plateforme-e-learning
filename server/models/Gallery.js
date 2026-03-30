const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Langues', 'Informatique', 'Concours']
  },
  imageUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gallery', gallerySchema); 