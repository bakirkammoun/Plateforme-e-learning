const mongoose = require('mongoose');

const supervisionSchema = new mongoose.Schema({
    cvId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    responseDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supervision', supervisionSchema); 