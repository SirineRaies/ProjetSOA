const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { bookingTypeDefs, flightTypeDefs, userTypeDefs } = require('./Schema');
const bookingResolvers = require('./Resolvers/BookingResolver');
const userResolvers = require('./Resolvers/UserResolver');
const flightResolvers = require('./Resolvers/FlightResolver');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { connectProducer } = require('./Kafka/Producer');
const { consumeMessages } = require('./Kafka/Consumer');
const app = express();
app.use(cors());
app.use(bodyParser.json());


const server = new ApolloServer({
  typeDefs: mergeTypeDefs([bookingTypeDefs, flightTypeDefs, userTypeDefs]),
  resolvers: mergeResolvers([bookingResolvers, flightResolvers, userResolvers]),
});

require('./Routes')(app);

(async () => {
  await server.start();
  await connectProducer();
  await consumeMessages("bookings");
  app.use('/graphql', expressMiddleware(server));
  app.listen(4000, () => console.log("🚀 Server ready at http://localhost:4000/graphql"));
})();
