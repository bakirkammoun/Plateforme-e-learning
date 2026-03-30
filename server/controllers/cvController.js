const CV = require('../models/CV');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/cv-images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
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

// Create or Update CV
exports.createOrUpdateCV = async (req, res) => {
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

      const userId = req.user.id; // Changed from _id to id to match auth middleware
      
      // Prepare CV data
      let cvData = {
        userId,
        name: req.body.name || '',
        phone: req.body.phone || '',
        email: req.body.email || '',
        address: req.body.address || '',
        linkedin: req.body.linkedin || '',
        github: req.body.github || '',
        summary: req.body.summary || '',
        technicalSkills: req.body.technicalSkills || '',
        softSkills: req.body.softSkills || '',
        languages: req.body.languages || ''
      };

      // Handle arrays
      try {
        cvData.workExperience = req.body.workExperience ? JSON.parse(req.body.workExperience) : [];
        cvData.education = req.body.education ? JSON.parse(req.body.education) : [];
        cvData.projects = req.body.projects ? JSON.parse(req.body.projects) : [];
        cvData.certifications = req.body.certifications ? JSON.parse(req.body.certifications) : [];
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON data in request'
        });
      }

      // Handle profile image
      if (req.file) {
        cvData.profileImage = req.file.filename;
      }

      console.log('Saving CV for user:', userId);
      console.log('CV Data:', cvData);

      // Find existing CV or create new one
      let cv = await CV.findOne({ userId });
      
      if (cv) {
        console.log('Updating existing CV');
        // If updating and there's a new image, delete the old one
        if (req.file && cv.profileImage) {
          const oldImagePath = path.join(uploadDir, cv.profileImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Update existing CV
        cv = await CV.findOneAndUpdate(
          { userId },
          cvData,
          { new: true }
        );
      } else {
        console.log('Creating new CV');
        // Create new CV
        cv = await CV.create(cvData);
      }

      console.log('CV saved successfully:', cv);

      res.status(200).json({
        success: true,
        message: cv ? 'CV mis à jour avec succès!' : 'CV créé avec succès!',
        cv: cv
      });
    } catch (error) {
      console.error('Error in createOrUpdateCV:', error);
      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de la sauvegarde du CV'
      });
    }
  });
};

// Get CV by ID
exports.getCV = async (req, res) => {
  try {
    const cv = await CV.findById(req.params.cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      cv: cv
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération du CV'
    });
  }
};

// Get my CV
exports.getMyCV = async (req, res) => {
  try {
    const userId = req.user.id; // Changed from _id to id
    console.log('Getting CV for user:', userId);

    const cv = await CV.findOne({ userId });
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV non trouvé'
      });
    }

    console.log('CV found:', cv);

    res.status(200).json({
      success: true,
      cv: cv
    });
  } catch (error) {
    console.error('Error in getMyCV:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération du CV'
    });
  }
}; 