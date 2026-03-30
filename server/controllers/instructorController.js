const User = require('../models/User');
const Formation = require('../models/Formation');

console.log('Modèle User importé:', User ? 'Oui' : 'Non');
console.log('Modèle Formation importé:', Formation ? 'Oui' : 'Non');

// Get all instructors
exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await User.find({ role: 'instructor' })
            .select('firstName lastName email profileImage bio specialization socialLinks rating numberOfRatings ratedBy phone address followers')
            .lean();

        // Pour chaque instructeur, récupérer ses formations et calculer ses statistiques
        const instructorsWithStats = await Promise.all(instructors.map(async (instructor) => {
            // Récupérer les formations de l'instructeur
            const formations = await Formation.find({ instructorId: instructor._id });
            
            // Calculer le nombre total d'étudiants
            const totalStudents = formations.reduce((sum, formation) => 
                sum + (formation.enrolledStudents?.length || 0), 0
            ) + (instructor.followers || 0);

            return {
                ...instructor,
                courses: formations,
                students: totalStudents,
                rating: instructor.rating || 0,
                numberOfRatings: instructor.numberOfRatings || 0,
                phone: instructor.phone || null,
                address: instructor.address || null,
                followers: instructor.followers || 0
            };
        }));

        res.json(instructorsWithStats);
    } catch (error) {
        console.error('Error in getAllInstructors:', error);
        res.status(500).json({ message: 'Error fetching instructors' });
    }
};

// Get instructor by ID
exports.getInstructorById = async (req, res) => {
    try {
        const instructor = await User.findOne({ 
            _id: req.params.id,
            role: 'instructor'
        })
        .select('firstName lastName email profileImage bio specialization socialLinks rating numberOfRatings ratedBy phone address followers following')
        .lean();

        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        // Récupérer les formations de l'instructeur
        const formations = await Formation.find({ instructorId: instructor._id });
        
        // Calculer les statistiques
        const enrolledStudents = formations.reduce((sum, formation) => 
            sum + (formation.enrolledStudents?.length || 0), 0
        );

        const instructorWithDetails = {
            ...instructor,
            courses: formations,
            enrolledStudents: enrolledStudents, // Nombre d'étudiants inscrits aux cours
            followers: Array.isArray(instructor.followers) ? instructor.followers : [], // S'assurer que followers est un tableau
            following: Array.isArray(instructor.following) ? instructor.following : [], // S'assurer que following est un tableau
            rating: instructor.rating || 0,
            numberOfRatings: instructor.numberOfRatings || 0,
            phone: instructor.phone || null,
            address: instructor.address || null
        };

        res.json(instructorWithDetails);
    } catch (error) {
        console.error('Error in getInstructorById:', error);
        res.status(500).json({ message: 'Error fetching instructor details' });
    }
};

// Get followed instructors for a user
exports.getFollowedInstructors = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Récupérer les IDs des instructeurs suivis
        const followedInstructorIds = user.following || [];
        
        if (followedInstructorIds.length === 0) {
            return res.json([]);
        }

        // Récupérer les détails des instructeurs suivis
        const followedInstructors = await User.find({
            _id: { $in: followedInstructorIds },
            role: 'instructor'
        })
        .select('firstName lastName email profileImage bio specialization socialLinks rating numberOfRatings ratedBy phone address followers')
        .lean();

        // Pour chaque instructeur, récupérer ses formations et calculer ses statistiques
        const instructorsWithStats = await Promise.all(followedInstructors.map(async (instructor) => {
            // Récupérer les formations de l'instructeur
            const formations = await Formation.find({ instructorId: instructor._id });
            
            // Calculer le nombre total d'étudiants
            const totalStudents = formations.reduce((sum, formation) => 
                sum + (formation.enrolledStudents?.length || 0), 0
            ) + (instructor.followers || 0);

            return {
                ...instructor,
                courses: formations,
                students: totalStudents,
                rating: instructor.rating || 0,
                numberOfRatings: instructor.numberOfRatings || 0,
                phone: instructor.phone || null,
                address: instructor.address || null,
                followers: instructor.followers || 0
            };
        }));

        // Trier par nombre de cours
        const sortedInstructors = instructorsWithStats
            .filter(instructor => instructor.courses && instructor.courses.length > 0)
            .sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0));

        res.json(sortedInstructors);
    } catch (error) {
        console.error('Error in getFollowedInstructors:', error);
        res.status(500).json({ message: 'Error fetching followed instructors' });
    }
};

// Rate an instructor
exports.rateInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        
        // Generate a random ID for anonymous users
        const anonymousId = Math.random().toString(36).substring(7);

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Invalid rating. Must be between 1 and 5' });
        }

        // Find instructor
        const instructor = await User.findOne({ _id: id, role: 'instructor' });
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        // Check if this anonymous ID has already rated this instructor
        if (instructor.ratedBy && instructor.ratedBy.includes(anonymousId)) {
            return res.status(400).json({ message: 'You have already rated this instructor' });
        }

        // Initialize rating fields if they don't exist
        if (!instructor.rating) instructor.rating = 0;
        if (!instructor.numberOfRatings) instructor.numberOfRatings = 0;
        if (!instructor.ratedBy) instructor.ratedBy = [];

        // Calculate new rating
        const newRating = ((instructor.rating * instructor.numberOfRatings) + rating) / (instructor.numberOfRatings + 1);

        // Update instructor
        instructor.rating = parseFloat(newRating.toFixed(1));
        instructor.numberOfRatings += 1;
        instructor.ratedBy.push(anonymousId);

        await instructor.save();

        res.json({
            message: 'Rating submitted successfully',
            rating: instructor.rating,
            numberOfRatings: instructor.numberOfRatings
        });
    } catch (error) {
        console.error('Error in rateInstructor:', error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
};

// Follow/Unfollow an instructor
exports.followInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'follow' or 'unfollow'

        // Find instructor
        const instructor = await User.findOne({ _id: id, role: 'instructor' });
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        // Initialize followers if it doesn't exist
        if (!instructor.followers) instructor.followers = 0;

        // Update followers count based on action
        if (action === 'unfollow') {
            if (instructor.followers > 0) {
                instructor.followers -= 1;
            }
        } else {
            instructor.followers += 1;
        }

        await instructor.save();

        res.json({
            message: action === 'unfollow' ? 'Successfully unfollowed instructor' : 'Successfully followed instructor',
            followers: instructor.followers
        });
    } catch (error) {
        console.error('Error in followInstructor:', error);
        res.status(500).json({ message: 'Error updating follow status' });
    }
};

// Get count of all instructors
exports.getInstructorCount = async (req, res) => {
    try {
        const count = await User.countDocuments({ role: 'instructor' });
        res.json({ count });
    } catch (error) {
        console.error('Error in getInstructorCount:', error);
        res.status(500).json({ message: 'Error counting instructors' });
    }
};

// Get count of followed instructors for the logged-in user
exports.getFollowedInstructorsCount = async (req, res) => {
    try {
        const userId = req.user.id; // L'ID de l'utilisateur connecté est disponible dans req.user grâce au middleware auth
        
        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Récupérer le nombre d'instructeurs suivis
        const followedCount = user.following ? user.following.length : 0;

        res.json({ count: followedCount });
    } catch (error) {
        console.error('Error in getFollowedInstructorsCount:', error);
        res.status(500).json({ message: 'Error counting followed instructors' });
    }
}; 