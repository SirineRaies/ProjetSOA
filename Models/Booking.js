const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  flightId: { type: String, required: true },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'], // Liste des statuts possibles
    default: 'pending', // Valeur par défaut si non spécifié
  },
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
