const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Vérifier la connexion SMTP
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erreur de configuration SMTP:', error);
  } else {
    console.log('Serveur SMTP prêt à envoyer des emails');
  }
});

// Configuration de multer pour l'upload de CV
const cvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/cv';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(new Error('Seuls les fichiers PDF, DOC et DOCX sont autorisés!'), false);
    }
    cb(null, true);
  }
}).single('cv');

//pour connait le role de l'utilisateur
const authController = {
  signup: async (req, res) => {
    try {
      uploadCV(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: 'Erreur lors de l\'upload du CV: ' + err.message
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { 
          firstName, 
          lastName, 
          email, 
          password, 
          role,
          sector,
          specialization,
          interests
        } = req.body;

        console.log('Données reçues:', { firstName, lastName, email, role, sector, specialization, interests });

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Cet email est déjà utilisé"
          });
        }

        // Validation des champs spécifiques au rôle
        if (role === 'instructor') {
          if (!sector || !specialization) {
            return res.status(400).json({
              success: false,
              message: "Les instructeurs doivent sélectionner un secteur et une spécialisation"
            });
          }
          if (!req.file) {
            return res.status(400).json({
              success: false,
              message: "Les instructeurs doivent télécharger un CV"
            });
          }
        }

        if (role === 'student' && (!interests || interests.length === 0)) {
          return res.status(400).json({
            success: false,
            message: "Les étudiants doivent sélectionner au moins un intérêt"
          });
        }

        // Générer un OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer le nouvel utilisateur
        const newUser = new User({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role,
          sector: role === 'instructor' ? sector : undefined,
          specialization: role === 'instructor' ? specialization : undefined,
          interests: role === 'student' ? interests : undefined,
          otp,
          otpExpires,
          isVerified: false,
          isApproved: role === 'instructor' ? false : true, // Les instructeurs sont automatiquement inactifs
          cv: role === 'instructor' ? req.file.filename : undefined
        });

        // Sauvegarder d'abord l'utilisateur
        await newUser.save();
        console.log('Utilisateur sauvegardé avec succès');

        try {
          // Préparer l'email
          const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Vérification de votre compte Smart Tech Academy',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0066FF;">Bienvenue sur Smart Tech Academy!</h2>
                <p>Bonjour ${firstName} ${lastName},</p>
                <p>Merci de vous être inscrit sur Smart Tech Academy. Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${otp}
                </div>
                <p>Ce code est valable pendant 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">Si vous n'avez pas créé de compte sur Smart Tech Academy, vous pouvez ignorer cet email.</p>
              </div>
            `
          };

          // Envoyer l'email
          await transporter.sendMail(mailOptions);
          console.log('Email envoyé avec succès');

          // Create notification for admin
          const admin = await User.findOne({ role: 'admin' });
          await Notification.create({
            recipient: admin._id,
            recipientRole: 'admin',
            sender: newUser._id,
            type: role === 'instructor' ? 'instructor_signup' : 'student_signup',
            message: role === 'instructor' 
              ? `Nouvel instructeur inscrit (en attente d'approbation) : ${firstName} ${lastName} (${email}) - Secteur : ${sector}, Spécialisation : ${specialization}`
              : `Nouvel étudiant inscrit : ${firstName} ${lastName} (${email})`,
            data: {
              userId: newUser._id,
              role: role,
              firstName,
              lastName,
              email,
              sector,
              specialization
            }
          });

          res.status(201).json({
            success: true,
            message: role === 'instructor' 
              ? "Un code de vérification a été envoyé à votre adresse email. Votre compte est en attente d'approbation par l'administrateur." 
              : "Un code de vérification a été envoyé à votre adresse email."
          });

        } catch (emailError) {
          console.error("Erreur détaillée d'envoi d'email:", emailError);
          // Ne pas supprimer l'utilisateur en cas d'échec d'envoi d'email
          res.status(201).json({
            success: true,
            message: "Inscription réussie, mais l'envoi de l'email a échoué. Veuillez contacter le support."
          });
        }

      });
    } catch (error) {
      console.error("Erreur détaillée d'inscription:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'inscription",
        error: error.message
      });
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      // Trouver l'utilisateur
      const user = await User.findOne({ 
        email,
        otp,
        otpExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Code OTP invalide ou expiré"
        });
      }

      // Mettre à jour l'utilisateur
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      // Générer le token
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
        message: "Compte vérifié avec succès",
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
      console.error("Erreur de vérification OTP:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du code OTP"
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Email ou mot de passe incorrect"
        });
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Email ou mot de passe incorrect"
        });
      }

      // Vérifier si le compte est actif
      if (!user.isApproved) {
        return res.status(403).json({
          success: false,
          message: "Votre compte est inactif. Veuillez contacter l'administrateur pour plus d'informations."
        });
      }

      // Créer le token avec la bonne structure
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

      // Envoyer la réponse avec le token et les informations de l'utilisateur
      res.json({
        success: true,
        token,
        authToken: token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        }
      });

    } catch (error) {
      console.error("Erreur de connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la connexion"
      });
    }
  },

  checkRole: async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token non fourni"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      res.json({
        success: true,
        role: user.role,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error("Erreur de vérification du rôle:", error);
      res.status(401).json({
        success: false,
        message: "Token invalide"
      });
    }
  }
};

module.exports = authController; 