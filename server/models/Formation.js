const mongoose = require("mongoose");

const formationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Langues', 'Informatique', 'Concours et Formation Scolaire']
    },
    level: {
        type: String,
        required: true,
        enum: [
            // Niveaux pour Langues
            'Débutant',
            'Elémentaire',
            'Intermédiaire',
            'Avancé',
            'Autonome',
            'Maîtrise',
            // Types pour Informatique
            'Développement Informatique',
            'Intelligence Artificielle et Big Data',
            'Graphique et Marketing Digital',
            'Bureautique',
            // Types pour Concours et Formation Scolaire
            'Préparation aux Concours',
            'Formation pour Tous les Niveaux'
        ]
    },
    duration: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    videos: {
        type: Array,
        default: []
    },
    documents: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    quizzes: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        questions: [{
            question: {
                type: String,
                required: true
            },
            options: [{
                type: String,
                required: true
            }],
            correctAnswer: {
                type: Number,
                required: true
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'pending', 'published', 'rejected'],
        default: 'draft'
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    numberOfRatings: {
        type: Number,
        default: 0
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
formationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.isModified('isArchived') && this.isArchived) {
        this.archivedAt = new Date();
    }
    next();
});

const Formation = mongoose.model("Formation", formationSchema);

module.exports = Formation; 