const mongoose = require('mongoose');
const Event = require('./models/Event');

// Fonction de test
async function testEventQuery() {
  try {
    // Se connecter à la base de données
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_database', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to database');

    // Créer un ID de test
    const testUserId = new mongoose.Types.ObjectId();
    console.log('Test user ID:', testUserId);

    // Tester la requête
    const events = await Event.find({
      participants: testUserId
    });
    console.log('Found events:', events.length);

    // Afficher la structure d'un événement
    if (events.length > 0) {
      console.log('Sample event structure:', JSON.stringify(events[0], null, 2));
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Exécuter le test
testEventQuery(); 