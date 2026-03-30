const Comment = require('../models/Comment');
const Formation = require('../models/Formation');

// Get all comments for a formation
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ 
      formationId: req.params.formationId,
      parentId: null // Get only top-level comments
    })
    .populate('userId', 'firstName lastName profileImage')
    .populate({
      path: 'replies',
      populate: {
        path: 'userId',
        select: 'firstName lastName profileImage'
      }
    })
    .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all comments for instructor's formations
exports.getInstructorComments = async (req, res) => {
  try {
    // First, get all formations by this instructor
    const formations = await Formation.find({ instructorId: req.params.instructorId });
    const formationIds = formations.map(formation => formation._id);

    // Then, get all comments for these formations
    const comments = await Comment.find({ 
      formationId: { $in: formationIds },
      parentId: null // Get only top-level comments
    })
    .populate('userId', 'firstName lastName profileImage')
    .populate('formationId', 'title')
    .populate({
      path: 'replies',
      populate: {
        path: 'userId',
        select: 'firstName lastName profileImage'
      }
    })
    .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching instructor comments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add a new comment
exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const formationId = req.params.formationId;
    const userId = req.user.id;

    // Verify if formation exists
    const formation = await Formation.findById(formationId);
    if (!formation) {
      return res.status(404).json({ message: 'Formation not found' });
    }

    const comment = new Comment({
      content,
      formationId,
      userId,
      parentId
    });

    const savedComment = await comment.save();

    // If this is a reply, add it to the parent comment's replies array
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment) {
        parentComment.replies.push(savedComment._id);
        await parentComment.save();
      }
    }

    // Populate the comment with user details including profile image
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('userId', 'firstName lastName profileImage');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author or the formation instructor
    const formation = await Formation.findById(comment.formationId);
    if (comment.userId.toString() !== req.user.id && formation.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.remove();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 