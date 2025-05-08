const grpc = require('@grpc/grpc-js');

// Charger les services gRPC
const protoLoader = require('@grpc/proto-loader');

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

  app.delete('/bookings/:id', (req, res) => {
    clients.booking.DeleteBooking({ booking_id: req.params.id }, (err, response) => {
      if (err) {
        return res.status(500).json({ error: err.details });
      }
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

  app.put('/flights/:id', (req, res) => {
    clients.flight.updateFlightSeats(
      { flight_id: req.params.id, seatsChange: req.body.seatsChange },
      (err, response) => {
        if (err) return res.status(500).json({ error: err.details });
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

  app.post('/users', (req, res) => {
    clients.user.createUser(req.body, (err, response) => {
      err ? res.status(500).json(err) : res.status(201).json(response.user);
    });
  });
};
