const express = require('express');
const router = express.Router();
const Archive = require('../models/Archive');
const Formation = require('../models/Formation');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Récupérer toutes les archives
router.get('/', auth, async (req, res) => {
  try {
    // Récupérer les archives du modèle Archive (non supprimées)
    const archives = await Archive.find({ isDeleted: { $ne: true } })
      .sort({ archivedAt: -1 })
      .populate('archivedBy', 'firstName lastName');

    // Récupérer les événements archivés (non supprimés)
    const archivedEvents = await Event.ArchivedEvent.find({ isDeleted: { $ne: true } })
      .sort({ archivedAt: -1 })
      .populate('instructorId', 'firstName lastName');

    // Récupérer les formations archivées (non supprimées)
    const archivedFormations = await Formation.find({ 
      isArchived: true,
      isDeleted: { $ne: true }
    })
      .sort({ archivedAt: -1 })
      .populate('instructorId', 'firstName lastName');

    // Transformer les événements archivés en format compatible avec les archives
    const transformedEvents = archivedEvents.map(event => ({
      _id: event._id,
      type: 'event',
      originalId: event.originalId,
      data: event.toObject(),
      archivedAt: event.archivedAt,
      archivedBy: event.instructorId
    }));

    // Transformer les formations archivées en format compatible avec les archives
    const transformedFormations = archivedFormations.map(formation => ({
      _id: formation._id,
      type: 'formation',
      originalId: formation._id,
      data: formation.toObject(),
      archivedAt: formation.archivedAt,
      archivedBy: formation.instructorId
    }));

    // Combiner toutes les archives
    const allArchives = [...archives, ...transformedEvents, ...transformedFormations].sort((a, b) => 
      new Date(b.archivedAt) - new Date(a.archivedAt)
    );

    res.json({
      success: true,
      data: allArchives,
      count: allArchives.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des archives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des archives'
    });
  }
});

// Créer une archive (utilisé automatiquement lors de la création/modification d'une formation ou événement)
router.post('/', auth, async (req, res) => {
  try {
    const { type, originalId, data } = req.body;

    const archive = new Archive({
      type,
      originalId,
      data,
      archivedBy: req.user.id
    });

    await archive.save();

    res.status(201).json({
      success: true,
      data: archive
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'archive:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'archive'
    });
  }
});

// Restaurer un élément archivé
router.post('/:id/restore', auth, async (req, res) => {
  try {
    // Vérifier d'abord dans le modèle Archive
    let archive = await Archive.findById(req.params.id);
    let isArchivedEvent = false;

    // Si non trouvé, vérifier dans les événements archivés
    if (!archive) {
      const archivedEvent = await Event.ArchivedEvent.findById(req.params.id);
      if (archivedEvent) {
        isArchivedEvent = true;
        archive = {
          type: 'event',
          data: archivedEvent.toObject(),
          originalId: archivedEvent.originalId
        };
      } else {
        return res.status(404).json({
          success: false,
          message: 'Archive non trouvée'
        });
      }
    }

    // Restaurer l'élément en fonction de son type
    switch (archive.type) {
      case 'formation':
        const formation = new Formation(archive.data);
        await formation.save();
        break;
      case 'event':
        const event = new Event(archive.data);
        await event.save();
        break;
      // Ajouter d'autres cas si nécessaire
    }

    // Supprimer l'archive
    if (isArchivedEvent) {
      await Event.ArchivedEvent.findByIdAndDelete(req.params.id);
    } else {
      await Archive.findByIdAndDelete(req.params.id);
    }

    res.json({
      success: true,
      message: 'Élément restauré avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la restauration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la restauration'
    });
  }
});

// Marquer une archive comme supprimée
router.delete('/:id', auth, async (req, res) => {
  try {
    // Essayer de trouver d'abord dans le modèle Archive
    let archive = await Archive.findById(req.params.id);

    if (archive) {
      // Si c'est une archive normale, la marquer comme supprimée
      archive.isDeleted = true;
      archive.deletedAt = new Date();
      await archive.save();
    } else {
      // Si ce n'est pas une archive normale, essayer de trouver dans les événements archivés
      const archivedEvent = await Event.ArchivedEvent.findById(req.params.id);
      if (archivedEvent) {
        archivedEvent.isDeleted = true;
        archivedEvent.deletedAt = new Date();
        await archivedEvent.save();
      } else {
        return res.status(404).json({
          success: false,
          message: 'Archive non trouvée'
        });
      }
    }

    res.json({
      success: true,
      message: 'Archive marquée comme supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

module.exports = router; 