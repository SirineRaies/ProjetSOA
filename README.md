# ✈️ Travel Booking Platform – Microservices Architecture

## 📌 Présentation du projet

Ce projet est une plateforme de réservation de vols construite avec une **architecture orientée microservices**. Elle permet aux utilisateurs de rechercher des vols, effectuer des réservations, et gérer leurs informations. L’objectif principal est de démontrer une architecture distribuée combinant REST, GraphQL, gRPC et MongoDB.

---

## 🏗️ Architecture du projet

Le système est divisé en **trois microservices principaux** :

1. **User Service** – Gestion des utilisateurs
2. **Flight Service** – Gestion des vols
3. **Booking Service** – Gestion des réservations

Une **API Gateway** permet l’interfaçage en REST et GraphQL. Les communications internes entre microservices s’appuient sur **gRPC**.

## 🌐 Points d'entrée

### 🔹 GraphQL (via Apollo Server)
- **URL** : `http://localhost:4000/graphql`
- **Requêtes disponibles** :
  - `searchFlights(departure: String, arrival: String, date: String, passengers: Int): [Flight]`
  - `userBookings(userId: String!): [Booking]`
  - `CreateBooking(userId: String!, flightId: String!): Booking`
  - `cancelBooking(id: String!): Booking`
  - `updateBookingStatus(id: String!, newStatus: String!): Booking`
  - `flights`, `users`, `bookings`, etc.

### 🔹 REST API (via Express Routes)
- **Exemples d’URL** :
  - `GET /api/users` – Liste des utilisateurs
  - `POST /api/bookings` – Créer une réservation
  - `POST /api/flights/search` – Rechercher des vols

### 🔹 gRPC
- **Services utilisés** :
  - `UserService`
  - `FlightService`
  - `BookingService`
- **Fichiers .proto** :
  - Chaque service expose des méthodes spécifiques définies dans des fichiers `.proto`.
  - Les appels gRPC permettent une communication rapide et typée entre microservices.

## 🧩 Technologies utilisées

- **Node.js** & **Express.js** : Pour construire le serveur et exposer des routes REST.
- **Apollo Server** : Pour la mise en place de l'API GraphQL.
- **MongoDB** : Base de données NoSQL pour le stockage des utilisateurs, vols et réservations.
- **gRPC** : Pour la communication performante entre microservices.
- **@graphql-tools/merge** : Pour fusionner les schémas et résolveurs GraphQL.
- **body-parser** & **cors** : Middleware Express pour la gestion des requêtes et de la sécurité CORS.

