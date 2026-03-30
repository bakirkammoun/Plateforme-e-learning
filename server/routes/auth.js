const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");
const authController = require("../controllers/authController");
const auth = require('../middleware/auth');

const router = express.Router();

// Email Transporter (Using Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Routes principales d'authentification
router.post("/signup", authController.signup);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);
router.get("/check-role", authController.checkRole);

// Route pour vérifier la validité du token
router.get('/verify-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    res.status(401).json({
      success: false,
      message: "Token invalide"
    });
  }
});

// Routes d'administration
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Administrateur uniquement."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Identifiants invalides"
      });
    }

    const token = jwt.sign(
      { 
        user: {
          id: user._id,
          role: user.role
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erreur de connexion admin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

router.post("/create-first-admin", async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: "Un compte administrateur existe déjà"
      });
    }

    const { firstName, lastName, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      isVerified: true
    });

    await adminUser.save();

    res.status(201).json({
      success: true,
      message: "Compte administrateur créé avec succès"
    });
  } catch (error) {
    console.error("Erreur de création admin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// Routes de réinitialisation de mot de passe
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Aucun compte associé à cet email"
      });
    }

    // Générer un OTP
    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Envoyer l'email avec l'OTP
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Réinitialisation de mot de passe",
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Votre code de vérification est : <strong>${otp}</strong></p>
        <p>Ce code expirera dans 1 heure.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Un code de vérification a été envoyé à votre email"
    });
  } catch (error) {
    console.error("Erreur d'envoi d'OTP:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du code de vérification"
    });
  }
});

router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Code de vérification invalide ou expiré"
      });
    }

    res.json({
      success: true,
      message: "Code vérifié avec succès"
    });
  } catch (error) {
    console.error("Erreur de vérification OTP:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du code"
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Code de vérification invalide ou expiré"
      });
    }

    // Mettre à jour le mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });
  } catch (error) {
    console.error("Erreur de réinitialisation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe"
    });
  }
});

module.exports = router;
