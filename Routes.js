const grpc = require('@grpc/grpc-js');

// Charger les services gRPC
const protoLoader = require('@grpc/proto-loader');
const { sendMessage } = require('./Kafka/Producer'); 


// Configuration des services gRPC
const services = {
  booking: {
    protoPath: './Protos/Booking.proto',
    port: 50052,
    serviceName: 'BookingService',
  },
  flight: {
    protoPath: './Protos/Flight.proto',
    port: 50053,
    serviceName: 'FlightService',
  },
  user: {
    protoPath: './Protos/User.proto',
    port: 50054,
    serviceName: 'UserService',
  },
};

// Charger les protos et créer les clients
const clients = {};
for (const [serviceName, config] of Object.entries(services)) {
  const packageDefinition = protoLoader.loadSync(config.protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition)[serviceName];
  clients[serviceName] = new proto[config.serviceName](
    `localhost:${config.port}`,
    grpc.credentials.createInsecure()
  );
}

module.exports = function(app) {
  // Routes REST Booking
  app.get('/bookings', (req, res) => {
    clients.booking.listAllBookings({}, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.bookings);
    });
  });

  app.delete('/bookings/:id', async (req, res) => {
    clients.booking.DeleteBooking({ booking_id: req.params.id }, async (err, response) => {
      if (err) {
        return res.status(500).json({ error: err.details });
      }
  
      await sendMessage('bookings', {
        event: 'BOOKING_DELETED',
        bookingId: req.params.id,
        timestamp: new Date().toISOString(),
      });
  
      res.json({ message: response.message });
    });
  });
  
  

  app.post('/bookings', (req, res) => {
    clients.booking.CreateBooking(req.body, (err, response) => {
      err ? res.status(500).json(err) : res.status(201).json(response.booking);
    });
  });

  // Routes REST Flight
  app.get('/flights', (req, res) => {
    clients.flight.listAllFlights({}, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.flights);
    });
  });

  app.put('/flights/:id', async (req, res) => {
    clients.flight.updateFlightSeats(
      { flight_id: req.params.id, seatsChange: req.body.seatsChange },
      async (err, response) => {
        if (err) return res.status(500).json({ error: err.details });
  
        await sendMessage('bookings', {
          event: 'FLIGHT_UPDATED',
          flight: response.flight,
          timestamp: new Date().toISOString(),
        });
  
        res.json(response.flight);
      }
    );
  });  
  

  app.get('/flights/search', (req, res) => {
    clients.flight.searchFlights(req.query, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.flights);
    });
  });

  app.get('/users', (req, res) => {
    clients.user.listAllUsers({}, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.users);
    });
  });

  app.post('/users', async (req, res) => {
    try {
      clients.user.createUser(req.body, async (err, response) => {
        if (err) {
          return res.status(500).json(err);
        }
  
        // Envoi d'un message Kafka après création
        await sendMessage('bookings', {
          event: 'USER_CREATED',
          user: response.user,
          timestamp: new Date().toISOString(),
        });
  
        res.status(201).json(response.user);
      });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing the request', details: error.message });
    }
  });
};
