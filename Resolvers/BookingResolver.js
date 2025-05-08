const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const bookingProtoPath = path.join(__dirname, '../Protos/Booking.proto');
const bookingProtoDefinition = protoLoader.loadSync(bookingProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const bookingProto = grpc.loadPackageDefinition(bookingProtoDefinition).booking;

const grpcClient = new bookingProto.BookingService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const bookingResolvers = {
  Query: {
    booking: async (_, { status }) => {
      return new Promise((resolve, reject) => {
        grpcClient.GetBooking({ status }, (err, response) => {
          if (err) {
            console.error("Erreur GraphQL GetBooking:", err);
            return reject(err);
          }
              resolve(response.bookings);
        });
      });
    },    
    bookings: () => {
      return new Promise((resolve, reject) => {
        grpcClient.listAllBookings({}, (err, response) => {
          err ? reject(err) : resolve(response.bookings);
        });
      });
    },
  },

  Mutation: {
    CreateBooking: (_, { userId, flightId }) => {
      return new Promise((resolve, reject) => {
        grpcClient.CreateBooking({ userId, flightId }, (err, response) => {
          err ? reject(err) : resolve(response.booking);
        });
      });
    },
    cancelBooking: (_, { id }) => {
      console.log(`Tentative de suppression de la réservation avec ID: ${id}`);
      return new Promise((resolve, reject) => {
        grpcClient.DeleteBooking({ booking_id: id }, (err, response) => {
          if (err) {
            console.error("Erreur lors de l'appel gRPC:", err);
            reject(new Error(`Erreur lors de la suppression de la réservation: ${err.details}`));
          } else {
            console.log("Réponse du serveur gRPC:", response);
            if (response && response.message === "Réservation supprimée avec succès") {
              resolve("Réservation supprimée avec succès");
            } else {
              reject(new Error("La réservation n'a pas pu être supprimée"));
            }
          }
        });
      });
    }
  }
  }    

module.exports = bookingResolvers;
