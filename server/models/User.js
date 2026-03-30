const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor", "admin"], required: true },
    isApproved: { type: Boolean, default: function() { return this.role === "student" || this.role === "admin"; } }, // Auto-approve students and admins, require approval for instructors
    isVerified: { type: Boolean, default: false }, // Ajout du champ isVerified
    sector: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function() { return this.role === "instructor"; }
    },
    specialization: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function() { return this.role === "instructor"; }
    },
    interests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Category',
        default: [],
        validate: {
            validator: function(v) {
                return this.role !== "student" || v.length > 0;
            },
            message: "Students must select at least one interest"
        }
    },
    otp: { type: String }, // Stores the OTP
    otpExpires: { type: Date }, // Expiry time for the OTP
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    phone: { type: String },
    address: { type: String },
    city: { type: String }, // Ajout du champ city
    bio: { type: String },
    profileImage: { type: String },
    cv: { type: String }, // Ajout du champ cv
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    enrolledFormations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Formation'
    }]
}, { timestamps: true });

// Méthode virtuelle pour obtenir le nombre de followers
UserSchema.virtual('followersCount').get(function() {
    return this.followers.length;
});

module.exports = mongoose.model("User", UserSchema);
