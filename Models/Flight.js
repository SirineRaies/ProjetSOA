const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightNumber: String,
  departure: String,
  arrival: String,
  date: Date,
  price: Number,
  seats: Number,
  availableSeats: Number,
  capacity: Number
});

module.exports = mongoose.model('Flight', flightSchema);
