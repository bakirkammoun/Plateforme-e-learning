const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configurer le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = file.mimetype.startsWith('image/') ? 'images' : 'videos';
    const dir = path.join(__dirname, `../uploads/${type}`);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    console.log(`Dossier de destination: ${dir}`);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log(`Nom du fichier généré: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // Augmenté à 500MB
  },
  fileFilter: (req, file, cb) => {
    console.log(`Type MIME du fichier: ${file.mimetype}`);
    if (file.fieldname === "image") {
      // Accepter seulement les images
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Seules les images sont autorisées!'));
      }
    } else if (file.fieldname === "video") {
      // Accepter seulement les vidéos
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Seuls les fichiers vidéo sont autorisés!'));
      }
    }
    cb(null, true);
  }
});

// Route pour upload une image
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }

    // Construire l'URL du fichier
    const fileUrl = `http://localhost:5000/uploads/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploadée avec succès',
      url: fileUrl
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
  }
});

// Route pour upload une vidéo
router.post('/video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }

    console.log('Fichier uploadé:', req.file);
    
    // Construire l'URL du fichier
    const fileUrl = `http://localhost:5000/uploads/videos/${req.file.filename}`;
    console.log('URL générée:', fileUrl);
    
    res.json({
      message: 'Vidéo uploadée avec succès',
      url: fileUrl,
      file: req.file
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la vidéo:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de la vidéo', error: error.message });
  }
});

// Configuration de multer pour les vidéos
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/videos';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)) {
            return cb(new Error('Seuls les fichiers vidéo sont autorisés!'));
        }
        cb(null, true);
    }
});

// Configuration de multer pour les documents PDF
const documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/documents';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const documentUpload = multer({
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(pdf)$/)) {
            return cb(new Error('Seuls les fichiers PDF sont autorisés!'));
        }
        cb(null, true);
    }
});

// Route pour l'upload de vidéo
router.post('/video', videoUpload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier n'a été uploadé" });
        }
        res.status(200).json({
            message: 'Vidéo uploadée avec succès',
            url: `/uploads/videos/${req.file.filename}`
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload de la vidéo:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload de la vidéo', error: error.message });
    }
});

// Route pour l'upload de document PDF
router.post('/document', documentUpload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier n'a été uploadé" });
        }
        res.status(200).json({
            message: 'Document uploadé avec succès',
            url: `/uploads/documents/${req.file.filename}`
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload du document:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload du document', error: error.message });
    }
});

module.exports = router; 