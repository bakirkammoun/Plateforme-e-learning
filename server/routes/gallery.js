const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Gallery = require('../models/Gallery');

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Gallery route is working' });
});

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/gallery');
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all images
router.get('/', async (req, res) => {
  try {
    console.log('Fetching images...');
    const images = await Gallery.find().sort({ createdAt: -1 });
    console.log('Found images:', images);
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload a new image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Uploading image...');
    console.log('Request body:', req.body);
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = path.join('uploads/gallery', req.file.filename).replace(/\\/g, '/');
    
    const newImage = new Gallery({
      category: req.body.category,
      imageUrl: imageUrl
    });

    console.log('Saving image:', newImage);
    const savedImage = await newImage.save();
    console.log('Image saved:', savedImage);
    
    res.status(201).json(savedImage);
  } catch (error) {
    console.error('Error uploading image:', error);
    if (req.file) {
      const filePath = req.file.path;
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete an image
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting image:', req.params.id);
    const image = await Gallery.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the physical file
    const filePath = path.join(__dirname, '..', image.imageUrl);
    console.log('Deleting file:', filePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Gallery.deleteOne({ _id: req.params.id });
    console.log('Image deleted successfully');
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 