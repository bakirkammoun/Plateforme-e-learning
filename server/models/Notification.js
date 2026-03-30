const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: function() {
            return !this.recipientRole;
        }
    },
    recipientRole: {
        type: String,
        enum: ['admin', 'instructor', 'student'],
        required: function() {
            return !this.recipient;
        }
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    type: { 
        type: String, 
        required: true,
        enum: [
            'cv_shared',
            'enrollment_request',
            'enrollment_approved',
            'enrollment_rejected',
            'supervision_request',
            'supervision_accepted',
            'supervision_rejected',
            'supervision_stopped',
            'payment_completed',
            'certificate_generated',
            'instructor_signup',
            'student_signup',
            'course_added',
            'event_added',
            'event_joined',
            'event_left',
            'quiz_completed',
            'instructor_followed'
        ]
    },
    message: { 
        type: String, 
        required: true 
    },
    data: {
        type: Object,
        default: {}
    },
    formationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Formation" 
    },
    enrollmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Enrollment" 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    }
}, {
    timestamps: true
});

// Index pour améliorer les performances de recherche
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
