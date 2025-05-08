const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const flightProtoPath = './Protos/Flight.proto';
const flightProtoDefinition = protoLoader.loadSync(flightProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const flightProto = grpc.loadPackageDefinition(flightProtoDefinition).flight;

const getFlightClient = () =>
  new flightProto.FlightService('localhost:50053', grpc.credentials.createInsecure());

const flightResolvers = {
  Query: {
    flight: (_, { id }) => {
      const client = getFlightClient();
      return new Promise((resolve, reject) => {
        client.getFlight({ flight_id: id }, (err, response) => {
          err ? reject(err) : resolve(response.flight);
        });
      });
    },
    flights: () => {
      const client = getFlightClient();
      return new Promise((resolve, reject) => {
        client.listAllFlights({}, (err, response) => {
          err ? reject(err) : resolve(response.flights);
        });
      });
    },
    searchFlights: (_, { departure, arrival }) => {
      const client = getFlightClient();
      return new Promise((resolve, reject) => {
        client.searchFlights({ departure, arrival }, (err, response) => {
          err ? reject(err) : resolve(response.flights);
        });
      });
    },
  },
  Mutation: {
    updateFlightSeats: (_, { id, seatsChange }) => {
      const client = getFlightClient();
      return new Promise((resolve, reject) => {
        client.updateFlightSeats({ flight_id: id, seatsChange }, (err, response) => {
          err ? reject(err) : resolve(response.flight);
        });
      });
    }
  }
};

module.exports = flightResolvers;
