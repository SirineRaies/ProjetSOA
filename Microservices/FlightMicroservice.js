// flightMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');
const Flight = require('../Models/Flight'); 

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/travel_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Modèle Mongoose pour Flight


// Charger le fichier flight.proto
const flightProtoPath = path.join(__dirname, '..', 'Protos', 'Flight.proto');

const flightProtoDefinition = protoLoader.loadSync(flightProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const flightProto = grpc.loadPackageDefinition(flightProtoDefinition).flight;

// Implémenter le service flight avec Mongoose
const flightService = {
  getFlight: async (call, callback) => {
    try {
      const flight = await Flight.findById(call.request.flight_id);
      if (!flight) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Vol non trouvé"
        });
      }
      callback(null, { flight: flight.toObject() });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur serveur"
      });
    }
  },

  searchFlights: async (call, callback) => {
    try {
      const { departure, arrival } = call.request;
      const query = { 
        departure: new RegExp(departure, 'i'),
        arrival: new RegExp(arrival, 'i')
      };

      const flights = await Flight.find(query);
      callback(null, { flights: flights.map(f => f.toObject()) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la recherche"
      });
    }
  },

  updateFlightSeats: async (call, callback) => {
    try {
      const { flight_id, seatsChange } = call.request;
      const flight = await Flight.findById(flight_id);

      if (!flight) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Vol non trouvé"
        });
      }

      // Vérifier qu'il y a assez de sièges disponibles
      if (flight.availableSeats + seatsChange < 0) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          details: "Nombre de sièges insuffisant"
        });
      }

      flight.availableSeats += seatsChange;
      const updatedFlight = await flight.save();

      callback(null, { flight: updatedFlight.toObject() });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la mise à jour"
      });
    }
  },

  listAllFlights: async (call, callback) => {
    try {
      const { page = 1, limit = 10 } = call.request;
      const skip = (page - 1) * limit;

      const flights = await Flight.find()
        .skip(skip)
        .limit(limit);

      callback(null, { flights: flights.map(f => f.toObject()) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la récupération"
      });
    }
  },

  createFlight: async (call, callback) => {
    try {
      const flightData = call.request;
      const newFlight = new Flight({
        id: Math.random().toString(36).substr(2, 9),
        ...flightData,
        availableSeats: flightData.seats || flightData.capacity
      });

      const savedFlight = await newFlight.save();
      callback(null, { flight: savedFlight.toObject() });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la création"
      });
    }
  }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(flightProto.FlightService.service, flightService);
const port = 50053; // Port différent des autres services
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('Échec de la liaison du serveur:', err);
      return;
    }
    console.log(`Serveur Flight en écoute sur le port ${port}`);
    server.start();
  });