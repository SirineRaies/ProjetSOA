const { faker } = require('@faker-js/faker/locale/fr');
const mongoose = require('mongoose');
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
}
// Import des modèles
const Flight = require('./Models/Flight');
const Booking = require('./Models/Booking');
const User = require('./Models/User');

// Configuration Faker
faker.seed(123); // Pour des résultats reproductibles

// 1. Génération des données
const generateFlights = (count = 20) => {
  return Array.from({ length: count }).map(() => ({
    flightNumber: `${faker.airline.airline().iataCode}${faker.airline.flightNumber()}`,
    departure: faker.location.city(),
    arrival: faker.location.city(),
    date: faker.date.soon({ days: 365 }),
    price: faker.number.float({ min: 50, max: 1500, precision: 0.01 }),
    seats: faker.number.int({ min: 100, max: 300 }), // Champ requis
    availableSeats: faker.number.int({ min: 0, max: 300 }),
    capacity: faker.number.int({ min: 100, max: 300 })
  }));
};

const generateUsers = (count = 10) => {
  return Array.from({ length: count }).map(() => ({
    name: faker.person.fullName()
  }));
};

const generateBookings = (users, flights, count = 30) => {
  return Array.from({ length: count }).map(() => ({
    userId: users[faker.number.int({ min: 0, max: users.length - 1 })]._id,
    flightId: flights[faker.number.int({ min: 0, max: flights.length - 1 })]._id,
    status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'CANCELLED']),
    createdAt: faker.date.past()
  }));
};

// 2. Fonction pour effacer les données existantes
async function clearDatabase() {
  try {
    console.log('⚡ Suppression des données existantes...');
    await mongoose.connection.dropDatabase();
    console.log('✅ Base de données nettoyée avec succès');
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage:', err);
    throw err;
  }
}

// 3. Fonction principale
async function seedDatabase() {
  try {
    await connectDB();
    
    // Optionnel : Demande de confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      readline.question('⚠️  Voulez-vous VRAIMENT effacer toutes les données et regénérer un jeu de test ? (y/N) ', answer => {
        if (answer.toLowerCase() !== 'y') {
          console.log('Annulation...');
          process.exit(0);
        }
        readline.close();
        resolve();
      });
    });

    await clearDatabase();

    console.log('\n🛫 Génération des vols...');
    const flights = await Flight.insertMany(generateFlights());
    
    console.log('👤 Génération des utilisateurs...');
    const users = await User.insertMany(generateUsers());
    
    console.log('📅 Génération des réservations...');
    const validBookings = generateBookings(users, flights)
      .filter(booking => !!booking.flightId); // Filtre les réservations invalides
    
    await Booking.insertMany(validBookings);

    // Vérification finale
    const bookingCount = await Booking.countDocuments();
    const sampleBooking = await Booking.findOne().populate('flightId').lean();

    console.log('\n✅ Base de données régénérée avec succès !');
    console.log(`- Vols: ${flights.length}`);
    console.log(`- Utilisateurs: ${users.length}`);
    console.log(`- Réservations valides: ${bookingCount}`);
    
    console.log('\n🔍 Exemple de réservation:');
    console.log({
      id: sampleBooking._id,
      user: sampleBooking.userId,
      flight: sampleBooking.flightId.number,
      status: sampleBooking.status
    });

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erreur lors du seeding:', err);
    process.exit(1);
  }
}

seedDatabase();
