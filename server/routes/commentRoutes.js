const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Get all comments for a formation
router.get('/formations/:formationId/comments', auth, commentController.getComments);

// Get all comments for instructor's formations
router.get('/instructor/:instructorId/comments', auth, commentController.getInstructorComments);

// Add a new comment
router.post('/formations/:formationId/comments', auth, commentController.addComment);

// Delete a comment
router.delete('/formations/:formationId/comments/:commentId', auth, commentController.deleteComment);

module.exports = router; 