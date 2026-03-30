const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Connexion MongoDB
console.log('\n=== Connexion à MongoDB ===');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connecté à MongoDB');
  startServer();
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:', err);
  process.exit(1);
});

function startServer() {
  // Import routes
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/userRoutes');
  const cvRoutes = require('./routes/cv');
  const formationRoutes = require('./routes/formationRoutes');
  const enrollmentRoutes = require('./routes/enrollmentRoutes');
  const eventRoutes = require('./routes/eventRoutes');
  const notificationRoutes = require('./routes/notifications');
  const messageRoutes = require('./routes/messages');
  const galleryRoutes = require('./routes/gallery');
  const uploadRoutes = require('./routes/upload');
  const commentRoutes = require('./routes/commentRoutes');
  const orderRoutes = require('./routes/orders');
  const quizResultsRoutes = require('./routes/quizResults');
  const emailRouter = require('./routes/emailNotifications');
  const certificateRoutes = require('./routes/certificates');
  const demographicRoutes = require('./routes/demographicRoutes');
  const mapRoutes = require('./routes/mapRoutes');
  const instructorRoutes = require('./routes/instructorRoutes');

  // Configuration CORS
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }));

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Middleware de logging global
  app.use((req, res, next) => {
    // Vérifier la connexion MongoDB
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'La base de données n\'est pas connectée',
        mongoStatus: mongoose.connection.readyState
      });
    }

    console.log('\n=== Nouvelle requête ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('URL:', req.originalUrl);
    console.log('Méthode:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
  });

  // Route de test simple
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'Serveur en ligne',
      mongoStatus: mongoose.connection.readyState
    });
  });

  // Route de santé de l'API
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK',
      mongoStatus: mongoose.connection.readyState,
      timestamp: new Date().toISOString(),
      routes: {
        certificates: '/api/certificates',
        certificatesGenerate: '/api/certificates/generate'
      }
    });
  });

  // Monter les routes API
  console.log('\n=== Montage des routes API ===');

  // Route des certificats avec logging spécifique
  app.use('/api/certificates', (req, res, next) => {
    console.log('\n=== Requête Certificats ===');
    console.log('URL:', req.originalUrl);
    console.log('Méthode:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('MongoDB Status:', mongoose.connection.readyState);
    next();
  }, certificateRoutes);

  // Autres routes API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/cv', cvRoutes);
  app.use('/api/formations', formationRoutes);
  app.use('/api/enrollments', enrollmentRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/quiz-results', quizResultsRoutes);
  app.use('/api/email', emailRouter);
  app.use('/api/admin', demographicRoutes);
  app.use('/api/admin', mapRoutes);
  app.use('/api/instructors', instructorRoutes);

  // Servir les fichiers statiques
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Log des routes disponibles
  console.log('\n=== Routes disponibles ===');
  app._router.stack
    .filter(r => r.route || r.name === 'router')
    .forEach(r => {
      if (r.route) {
        console.log(`${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
      } else if (r.name === 'router') {
        console.log('Router:', r.regexp);
      }
    });

  // Catch-all route pour les routes non trouvées
  app.use('*', (req, res) => {
    console.log('\n=== Route non trouvée ===');
    console.log('URL:', req.originalUrl);
    console.log('Méthode:', req.method);
    console.log('Headers:', req.headers);
    res.status(404).json({ 
      message: 'Route non trouvée',
      requestedUrl: req.originalUrl,
      method: req.method,
      mongoStatus: mongoose.connection.readyState,
      availableRoutes: {
        test: '/api/test',
        health: '/api/health',
        certificates: '/api/certificates',
        certificatesGenerate: '/api/certificates/generate'
      }
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('\n=== Erreur Serveur ===');
    console.error('URL:', req.originalUrl);
    console.error('Méthode:', req.method);
    console.error('Erreur:', err);
    res.status(500).json({ 
      message: 'Une erreur est survenue',
      mongoStatus: mongoose.connection.readyState,
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  });

  // Démarrage du serveur
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n=== Serveur démarré ===`);
    console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
    console.log(`📝 API des certificats: http://localhost:${PORT}/api/certificates`);
    console.log(`🔍 Test API: http://localhost:${PORT}/api/test`);
    console.log(`💓 Santé API: http://localhost:${PORT}/api/health`);
    console.log(`MongoDB Status: ${mongoose.connection.readyState}`);
    console.log(`========================\n`);
  });
}

module.exports = app; 