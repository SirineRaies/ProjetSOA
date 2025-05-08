const { gql } = require('@apollo/server');

// Schéma GraphQL pour Booking
const bookingTypeDefs = `#graphql
  type Booking {
    id: String!
    userId: String!
    flightId: String!
    status: String! # "confirmed", "cancelled", "pending"
  }

  type Query {
    booking(status: String!): [Booking]
    bookings: [Booking]
  }

  type Mutation {
    CreateBooking(userId: String!, flightId: String!): Booking
    cancelBooking(id: String!): String
  }
`;

// Schéma GraphQL pour Flight
const flightTypeDefs = `#graphql
  type Flight {
    id: String!
    flightNumber: String!
    departure: String!
    arrival: String!
    date: String!
    price: Float!
    seats: Int!
    availableSeats: Int!
    capacity: Int!
  }

  type Query {
    flight(id: String!): Flight
    flights: [Flight]
    searchFlights(departure: String!, arrival: String!): [Flight]
  }

  type Mutation {
    updateFlightSeats(id: String!, seatsChange: Int!): Flight
  }
`;

// Schéma GraphQL pour User
const userTypeDefs = `#graphql
  type User {
    id: String!
    name: String!
  }

  type Query {
    user(id: String!): User
    users: [User]
  }

  type Mutation {
    createUser(name: String!): User
    updateUserName(id: String!, newName: String!): User
  }
`;

module.exports = {
  bookingTypeDefs,
  flightTypeDefs,
  userTypeDefs
};