const express = require("express");
const multer = require("multer");
const Event = require("../models/Event");
const path = require("path");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const jwt = require('jsonwebtoken');
const { ArchivedEvent } = require("../models/Event");

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store files in 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'), false);
    }
  }
});

// Middleware d'authentification simplifié
const simpleAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token found, attempting to verify...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Récupérer l'ID utilisateur en tenant compte des différentes structures possibles
    const userId = decoded.id || decoded._id || (decoded.user && (decoded.user.id || decoded.user._id));

    if (!userId) {
      console.error('No user ID found in token:', decoded);
      return res.status(401).json({ message: 'Token invalide: ID utilisateur manquant' });
    }

    console.log('User ID extracted from token:', userId);

    // Convertir en ObjectId valide
    try {
      req.userId = new mongoose.Types.ObjectId(userId);
      console.log('Valid ObjectId created:', req.userId);
    } catch (error) {
      console.error('Invalid ObjectId format:', userId);
      return res.status(400).json({ message: 'Format d\'ID utilisateur invalide' });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    return res.status(401).json({ message: 'Authentification échouée' });
  }
};

// Placer la route suggest-date AVANT les routes avec paramètres
router.get('/suggest-date', async (req, res) => {
  try {
    console.log('Début de la recherche de date suggérée');
    
    // Récupérer les dates à exclure depuis la requête
    const excludeDates = req.query.exclude ? req.query.exclude.split(',').map(date => new Date(date)) : [];
    console.log('Dates à exclure:', excludeDates);
    
    // 1. Initialiser les dates de début et de fin
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(23, 59, 59, 999);
    
    console.log('Période de recherche:', {
      today: today.toISOString(),
      nextMonth: nextMonth.toISOString()
    });

    // 2. Récupérer tous les événements existants
    const events = await Event.find({}).select('title startDate endDate startTime endTime').lean();

    console.log(`Nombre d'événements trouvés: ${events.length}`);

    // 3. Créer un tableau de toutes les dates possibles
    const allDates = [];
    const currentDate = new Date(today);
    
    while (currentDate <= nextMonth) {
      // Exclure les dimanches (0 = dimanche)
      if (currentDate.getDay() !== 0) {
        allDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 4. Filtrer les dates disponibles
    const availableDates = allDates.filter(date => {
      const dateToCheck = new Date(date);
      dateToCheck.setHours(12, 0, 0, 0); // Midi pour la comparaison

      // Vérifier si la date est dans les dates à exclure
      const isExcluded = excludeDates.some(excludeDate => {
        const excDate = new Date(excludeDate);
        excDate.setHours(0, 0, 0, 0);
        return dateToCheck.getTime() === excDate.getTime();
      });

      if (isExcluded) {
        return false;
      }

      return !events.some(event => {
        try {
          if (!event.startDate || !event.endDate) return false;

          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);

          // Normaliser les heures
          eventStart.setHours(0, 0, 0, 0);
          eventEnd.setHours(23, 59, 59, 999);

          return dateToCheck >= eventStart && dateToCheck <= eventEnd;
        } catch (error) {
          console.error('Erreur lors de la comparaison avec l\'événement:', error);
          return false;
        }
      });
    });

    // 5. Trouver la meilleure date (au moins 3 jours dans le futur)
    const minDaysAhead = 3;
    const bestDate = availableDates.find(date => {
      const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      return daysDiff >= minDaysAhead;
    });

    // 6. Préparer la réponse
    const response = {
      suggestedDate: bestDate ? bestDate.toISOString() : null,
      availableDates: availableDates.map(date => date.toISOString()),
      searchPeriod: {
        start: today.toISOString(),
        end: nextMonth.toISOString()
      },
      totalDates: allDates.length,
      availableDatesCount: availableDates.length,
      events: events.map(event => ({
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate
      }))
    };

    console.log('Réponse préparée:', {
      hasSuggestedDate: !!response.suggestedDate,
      availableDatesCount: response.availableDatesCount,
      totalEvents: response.events.length,
      excludedDatesCount: excludeDates.length
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erreur dans suggest-date:', error);
    return res.status(500).json({
      message: 'Erreur lors de la recherche de date suggérée',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour récupérer les événements rejoints
router.get('/joined', simpleAuth, async (req, res) => {
  try {
    console.log('Fetching joined events for user:', req.userId);

    const events = await Event.find({
      participants: req.userId
    })
    .sort({ startDate: -1 })
    .select('title description startDate endDate location image participants');

    console.log(`Found ${events.length} events for user ${req.userId}`);
    res.json(events);
  } catch (error) {
    console.error('Error in /joined route:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer les événements rejoints par un étudiant spécifique
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Fetching events for student:', studentId);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error('Invalid ObjectId:', studentId);
      return res.status(400).json({ 
        message: "Invalid student ID format",
        error: "The provided ID is not a valid MongoDB ObjectId"
      });
    }

    const events = await Event.find({ 
      participants: studentId 
    })
    .sort({ startDate: 1 });
    
    console.log('Found events:', events.length);
    console.log('Events:', JSON.stringify(events, null, 2));
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des événements",
      error: error.message 
    });
  }
});

// Get Events by Instructor ID Route (GET)
router.get("/instructor/:instructorId", async (req, res) => {
  try {
    const { instructorId } = req.params;
    console.log('Fetching events for instructor:', instructorId);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      console.error('Invalid ObjectId:', instructorId);
      return res.status(400).json({ 
        message: "Invalid instructor ID format",
        error: "The provided ID is not a valid MongoDB ObjectId"
      });
    }

    const events = await Event.find({ 
      instructorId: instructorId 
    }).sort({ startDate: 1 });
    
    console.log('Found events:', events.length);
    console.log('Events:', JSON.stringify(events, null, 2));
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des événements",
      error: error.message 
    });
  }
});

// Route pour lister les événements archivés
router.get('/archived-events', async (req, res) => {
  try {
    const archivedEvents = await ArchivedEvent.find()
      .sort({ archivedAt: -1 })
      .populate('instructorId', 'firstName lastName');
    res.json(archivedEvents);
  } catch (error) {
    console.error('Error fetching archived events:', error);
    res.status(500).json({ 
      message: 'Error fetching archived events',
      error: error.message 
    });
  }
});

// Get Event by ID Route (GET) - PLACER CETTE ROUTE EN DERNIER
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Events Route (GET)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Event Route (POST)
router.post("/", upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'eventVideo', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received event creation request with body:', req.body);
    console.log('Received files:', req.files);

    // Validate required fields
    const requiredFields = ['title', 'startDate', 'endDate', 'startTime', 'endTime', 'location', 'instructorId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedFields: Object.keys(req.body)
      });
    }

    // Parse and validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format",
        startDate: req.body.startDate,
        endDate: req.body.endDate
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }

    // Vérifier si l'enseignant a déjà un événement à cette date
    const existingEvent = await Event.findOne({
      instructorId: req.body.instructorId,
      $or: [
        {
          $and: [
            { startDate: { $lte: startDate } },
            { endDate: { $gte: startDate } }
          ]
        },
        {
          $and: [
            { startDate: { $lte: endDate } },
            { endDate: { $gte: endDate } }
          ]
        }
      ]
    });

    if (existingEvent) {
      return res.status(400).json({
        message: "Vous avez déjà un événement prévu à cette date",
        existingEvent: {
          title: existingEvent.title,
          startDate: existingEvent.startDate,
          endDate: existingEvent.endDate
        }
      });
    }

    const eventData = {
      title: req.body.title,
      description: req.body.description || '',
      color: req.body.color || 'Primary',
      startDate,
      endDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      location: req.body.location,
      maxParticipants: parseInt(req.body.maxParticipants) || 0,
      isPublic: req.body.isPublic === 'true',
      instructorId: req.body.instructorId,
      participants: []
    };

    // Handle main event image
    if (req.files?.image) {
      eventData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Handle event details
    eventData.eventDetails = {};

    // Handle video
    if (req.files?.eventVideo) {
      eventData.eventDetails.eventVideo = `/uploads/${req.files.eventVideo[0].filename}`;
    }

    // Handle section 1
    if (req.body.title1 || req.body.paragraph1 || req.files?.image1) {
      eventData.eventDetails.section1 = {
        title1: req.body.title1 || '',
        paragraph1: req.body.paragraph1 || ''
      };
      if (req.files?.image1) {
        eventData.eventDetails.section1.image1 = `/uploads/${req.files.image1[0].filename}`;
      }
    }

    // Handle section 2
    if (req.body.title2 || req.body.paragraph2 || req.files?.image2) {
      eventData.eventDetails.section2 = {
        title2: req.body.title2 || '',
        paragraph2: req.body.paragraph2 || ''
      };
      if (req.files?.image2) {
        eventData.eventDetails.section2.image2 = `/uploads/${req.files.image2[0].filename}`;
      }
    }

    console.log('Creating event with data:', eventData);
    const event = new Event(eventData);
    const newEvent = await event.save();
    console.log('Event created successfully:', newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
});

// Update Event by ID Route (PUT)
router.put("/:id", upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'eventVideo', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 }
]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create an update object with only the fields that are provided
    const updateData = {};
    
    // Add fields to update object if they exist in the request
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.color) updateData.color = req.body.color;
    if (req.body.startDate) updateData.startDate = req.body.startDate;
    if (req.body.endDate) updateData.endDate = req.body.endDate;
    if (req.body.startTime) updateData.startTime = req.body.startTime;
    if (req.body.endTime) updateData.endTime = req.body.endTime;
    if (req.body.location) updateData.location = req.body.location;
    if (req.body.maxParticipants !== undefined) updateData.maxParticipants = req.body.maxParticipants;
    if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;
    if (req.body.instructorId) updateData.instructorId = req.body.instructorId;

    // Handle main image update
    if (req.files?.image) {
      updateData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Handle event details update
    updateData.eventDetails = event.eventDetails || {};

    // Handle video update
    if (req.files?.eventVideo) {
      updateData.eventDetails.eventVideo = `/uploads/${req.files.eventVideo[0].filename}`;
    }

    // Handle section 1 update
    updateData.eventDetails.section1 = event.eventDetails.section1 || {};
    if (req.body.title1 !== undefined) updateData.eventDetails.section1.title1 = req.body.title1;
    if (req.body.paragraph1 !== undefined) updateData.eventDetails.section1.paragraph1 = req.body.paragraph1;
    if (req.files?.image1) {
      updateData.eventDetails.section1.image1 = `/uploads/${req.files.image1[0].filename}`;
    }

    // Handle section 2 update
    updateData.eventDetails.section2 = event.eventDetails.section2 || {};
    if (req.body.title2 !== undefined) updateData.eventDetails.section2.title2 = req.body.title2;
    if (req.body.paragraph2 !== undefined) updateData.eventDetails.section2.paragraph2 = req.body.paragraph2;
    if (req.files?.image2) {
      updateData.eventDetails.section2.image2 = `/uploads/${req.files.image2[0].filename}`;
    }

    // Validate dates if they are being updated
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.endDate) < new Date(updateData.startDate)) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
    }

    // Update the event using findByIdAndUpdate
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete Event by ID Route (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Copier dans la collection d'archives avant suppression
    await ArchivedEvent.create({ ...event.toObject(), originalId: event._id, isArchived: true, archivedAt: new Date() });
    await event.deleteOne();
    res.json({ message: "Event archived and deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour s'inscrire à un événement
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log('Join request received:', { 
      eventId: id, 
      userId,
      body: req.body,
      headers: req.headers
    });

    // Validation de base
    if (!id || !userId) {
      console.log('Missing required fields:', { id, userId });
      return res.status(400).json({ 
        success: false,
        message: 'Event ID and User ID are required' 
      });
    }

    // Valider les IDs MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid event ID:', id);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid event ID format' 
      });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID:', userId);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }

    // Vérifier si l'événement existe
    const event = await Event.findById(id);
    console.log('Found event:', event ? {
      id: event._id,
      title: event.title,
      maxParticipants: event.maxParticipants,
      participants: event.participants
    } : 'null');

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    // Vérifier si maxParticipants est défini
    if (typeof event.maxParticipants !== 'number') {
      console.log('Invalid maxParticipants:', event.maxParticipants);
      return res.status(400).json({
        success: false,
        message: 'Event maximum participants is not properly configured'
      });
    }

    // Initialiser le tableau des participants
    if (!Array.isArray(event.participants)) {
      console.log('Initializing participants array');
      event.participants = [];
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const isAlreadyRegistered = event.participants.some(
      participantId => participantId && participantId.toString() === userId.toString()
    );
    
    console.log('Registration check:', {
      isAlreadyRegistered,
      currentParticipants: event.participants.length,
      maxParticipants: event.maxParticipants
    });

    if (isAlreadyRegistered) {
      return res.status(400).json({ 
        success: false,
        message: 'You are already registered for this event' 
      });
    }

    // Vérifier si l'événement n'est pas complet
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ 
        success: false,
        message: 'Event is full',
        currentParticipants: event.participants.length,
        maxParticipants: event.maxParticipants
      });
    }

    // Ajouter l'utilisateur aux participants
    event.participants.push(new mongoose.Types.ObjectId(userId));
    
    console.log('Saving event with new participant:', {
      eventId: event._id,
      newParticipantId: userId,
      totalParticipants: event.participants.length
    });

    await event.save();

    console.log('Event saved successfully');

    // Retourner l'événement mis à jour
    res.json({
      success: true,
      message: 'Successfully joined the event',
      event: {
        ...event.toObject(),
        participantsCount: event.participants.length,
        remainingSpots: event.maxParticipants - event.participants.length
      }
    });

  } catch (error) {
    console.error('Error joining event:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Error joining event',
      error: error.message,
      details: error.name === 'ValidationError' ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
});

// Route pour se désinscrire d'un événement
router.post('/:id/disjoin', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log('Disjoin request received:', { eventId: id, userId });

    // Validation des IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Récupérer l'événement
    const event = await Event.findById(id);
    
    // Vérifier si l'événement existe
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Vérifier si l'utilisateur est inscrit
    if (!event.participants.includes(userId)) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    // Retirer le participant
    event.participants = event.participants.filter(
      participantId => participantId.toString() !== userId.toString()
    );

    // Sauvegarder les modifications
    await event.save();

    // Envoyer la réponse
    res.json({
      success: true,
      message: 'Successfully left the event',
      participantsCount: event.participants.length,
      remainingSpots: event.maxParticipants - event.participants.length
    });

  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Route pour compter les événements joints par un utilisateur
router.get('/user/:userId/joined-count', simpleAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Vérifier l'autorisation
    if (req.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Compter les événements où l'utilisateur est participant
    const count = await Event.countDocuments({
      participants: userId
    });

    console.log(`Nombre d'événements joints par l'utilisateur ${userId}: ${count}`);

    res.json({
      count: count
    });
  } catch (error) {
    console.error('Erreur lors du comptage des événements joints:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour archiver un événement
router.post('/:id/archive', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Créer une copie dans ArchivedEvent
    const archivedEvent = new ArchivedEvent({
      ...event.toObject(),
      originalId: event._id,
      isArchived: true,
      archivedAt: new Date()
    });
    await archivedEvent.save();

    // Mettre à jour l'événement original
    event.isArchived = true;
    event.archivedAt = new Date();
    await event.save();

    res.json(event);
  } catch (err) {
    console.error('Error archiving event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route pour restaurer un événement archivé
router.put('/:id/restore', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Vérifier si l'événement existe dans les archives
    const archivedEvent = await ArchivedEvent.findById(eventId);
    if (!archivedEvent) {
      return res.status(404).json({ message: 'Événement archivé non trouvé' });
    }

    // Créer une copie dans la collection Event
    const eventData = archivedEvent.toObject();
    delete eventData._id; // Supprimer l'ID pour en créer un nouveau
    delete eventData.isArchived;
    delete eventData.archivedAt;
    delete eventData.originalId;

    const restoredEvent = new Event(eventData);
    await restoredEvent.save();

    // Supprimer l'événement des archives
    await ArchivedEvent.findByIdAndDelete(eventId);

    res.json({
      message: 'Événement restauré avec succès',
      event: restoredEvent
    });
  } catch (error) {
    console.error('Error restoring event:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la restauration de l\'événement',
      error: error.message 
    });
  }
});

module.exports = router;
