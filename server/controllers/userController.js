const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-images';
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

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files (jpg, jpeg, png) are allowed!'), false);
    }
    cb(null, true);
  }
}).single('profileImage');

// Mettre à jour le profil utilisateur
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Utiliser l'ID de l'utilisateur connecté
    const updateData = req.body;

    console.log('Données de mise à jour reçues:', updateData); // Log pour le débogage

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'bio', 'profileImage'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    // Sauvegarder les modifications
    await user.save();

    console.log('Profil mis à jour avec succès:', user); // Log pour le débogage

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: error.message
    });
  }
};

// Récupérer le profil utilisateur
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select('firstName lastName email role phone address bio profileImage createdAt lastLogin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message
    });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  upload(req, res, async function (err) {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Supprimer l'ancienne image si elle existe
      if (user.profileImage) {
        const oldImagePath = path.join('uploads/profile-images', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Mettre à jour le chemin de l'image dans le profil utilisateur
      user.profileImage = req.file.filename;
      await user.save();

      res.json({
        success: true,
        message: 'Profile image updated successfully',
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading profile image'
      });
    }
  });
}; 