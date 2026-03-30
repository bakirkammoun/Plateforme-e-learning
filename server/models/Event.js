const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: 'Primary' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String },
  maxParticipants: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  eventDetails: {
    eventVideo: { type: String },
    section1: {
      image1: { type: String },
      title1: { type: String },
      paragraph1: { type: String }
    },
    section2: {
      image2: { type: String },
      title2: { type: String },
      paragraph2: { type: String }
    }
  },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Ajouter un index pour isDeleted
eventSchema.index({ isDeleted: 1 });

const Event = mongoose.model("Event", eventSchema);
const ArchivedEvent = mongoose.model("ArchivedEvent", eventSchema);

module.exports = Event;
module.exports.ArchivedEvent = ArchivedEvent;
