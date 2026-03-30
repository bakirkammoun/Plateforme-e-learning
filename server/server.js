require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const eventRoutes = require("./routes/eventRoutes"); // Ensure correct filename
const formationRoutes = require("./routes/formations"); // Ajout des routes de formations
const uploadRoutes = require("./routes/upload");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require('./routes/userRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const notificationRoutes = require('./routes/notifications');
const instructorRoutes = require('./routes/instructorRoutes');
const cvRoutes = require('./routes/cv');
const messagesRoutes = require('./routes/messages');
const galleryRoutes = require('./routes/gallery'); // Add gallery routes
const orderRoutes = require('./routes/orders'); // Add orders routes
const certificateRoutes = require('./routes/certificates');
const archiveRoutes = require('./routes/archives'); // Nouvelle ligne
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3005'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir);
}

// Create gallery uploads directory
const galleryUploadsDir = path.join(uploadsDir, 'gallery');
if (!require('fs').existsSync(galleryUploadsDir)) {
  require('fs').mkdirSync(galleryUploadsDir, { recursive: true });
}

// Configuration pour servir les fichiers statiques avec les bons headers
app.use('/uploads', (req, res, next) => {
  console.log('Accès au fichier:', req.url);
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    console.log('Type de fichier servi:', filePath);
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    routes: {
      certificates: '/api/certificates',
      certificatesGenerate: '/api/certificates/generate'
    }
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/formations", formationRoutes); // Cette route gère maintenant aussi les archives
app.use("/api/upload", uploadRoutes);
app.use("/api", commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/archives', archiveRoutes);

// Certificate routes with logging
app.use('/api/certificates', (req, res, next) => {
  console.log('\n=== Certificate Request ===');
  console.log('URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
}, certificateRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Le serveur fonctionne correctement' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log('📝 Routes disponibles:');
  console.log('  - POST   /api/enrollments');
  console.log('  - GET    /api/enrollments/student/enrollments');
  console.log('  - GET    /api/enrollments/instructor/enrollments');
  console.log('  - PATCH  /api/enrollments/:enrollmentId/status');
});
