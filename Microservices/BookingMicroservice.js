// bookingMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');
const Booking = require('../Models/Booking'); 
// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/travel_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));



// Charger le fichier booking.proto
const bookingProtoPath = path.join(__dirname, '..', 'Protos', 'Booking.proto');

const bookingProtoDefinition = protoLoader.loadSync(bookingProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const bookingProto = grpc.loadPackageDefinition(bookingProtoDefinition).booking;

// Implémenter le service booking avec Mongoose
const bookingService = {
  GetBooking: async (call, callback) => {
    try {
      // Trouver toutes les réservations avec le statut donné
      const bookings = await Booking.find({ status: call.request.status });
      
      if (!bookings || bookings.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Aucune réservation trouvée avec ce statut"
        });
      }
  
      // Si des réservations sont trouvées, renvoyer la liste
      callback(null, { bookings: bookings.map(booking => booking.toObject()) });
      
    } catch (err) {
      console.error("Erreur dans GetBooking:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur serveur"
      });
    }
  },
  
  CreateBooking: async (call, callback) => {
    try {
      const { userId, flightId } = call.request;
      console.log(" Requête reçue pour CreateBooking avec :", call.request);
  
      const newBooking = new Booking({
        id: Math.random().toString(36).substr(2, 9),
        userId,
        flightId,
        status: 'pending'
      });
  
      const savedBooking = await newBooking.save();
      console.log(" Réservation sauvegardée :", savedBooking);
  
      callback(null, { booking: savedBooking.toObject() });
  
    } catch (err) {
      console.error(" Erreur MongoDB:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la création de la réservation"
      });
    }
  },  

  listAllBookings: async (call, callback) => {
    try {
         const { page = 1, limit = 10 } = call.request;
         const skip = (page - 1) * limit;
   
         const bookings = await Booking.find()
           .skip(skip)
           .limit(limit);
   
         callback(null, { bookings: bookings.map(f => f.toObject()) });
       } catch (err) {
         callback({
           code: grpc.status.INTERNAL,
           details: "Erreur lors de la récupération"
         });
       }
     },

     DeleteBooking: async (call, callback) => {
      try {
        const result = await Booking.findByIdAndDelete(call.request.booking_id);
    
        if (!result) {
          return callback({
            code: grpc.status.NOT_FOUND,
            details: "Réservation non trouvée"
          });
        }
    
        callback(null, { message: "Réservation supprimée avec succès" });
      } catch (err) {
        callback({
          code: grpc.status.INTERNAL,
          details: "Erreur lors de la suppression de la réservation"
        });
      }
    }
    
    };

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(bookingProto.BookingService.service, bookingService);
const port = 50052; // Port différent du service movie
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('Échec de la liaison du serveur:', err);
      return;
    }
    console.log(`Serveur Booking en écoute sur le port ${port}`);
    server.start();
  });