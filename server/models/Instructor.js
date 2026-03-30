const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  // ... existing fields ...
  followers: {
    type: Number,
    default: 0
  },
  // ... rest of the schema
});

module.exports = mongoose.model('Instructor', instructorSchema); 