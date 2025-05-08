// userMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../Models/User'); 

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/travel_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));



// Charger le fichier user.proto
const userProtoPath = path.join(__dirname, '..', 'Protos', 'User.proto');

const userProtoDefinition = protoLoader.loadSync(userProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(userProtoDefinition).user;

// Implémenter le service user avec Mongoose
const userService = {
  getUser: async (call, callback) => {
    try {
      const user = await User.findById(call.request.user_id);

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Utilisateur non trouvé"
        });
      }
      callback(null, { user: user.toObject() });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur serveur"
      });
    }
  },

  createUser: async (call, callback) => {
    try {
      const { name } = call.request;
      const newUser = new User({
        id: Math.random().toString(36).substr(2, 9),
        name
      });
      const savedUser = await newUser.save();
      callback(null, { user: savedUser.toObject() });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la création"
      });
    }
  },

  updateUserName: async (call, callback) => {
  try {
    const { user_id, new_name } = call.request;
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { name: new_name },
      { new: true }
    );

    if (!updatedUser) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Utilisateur non trouvé"
      });
    }

    callback(null, { user: updatedUser.toObject() });
  } catch (err) {
    callback({
      code: grpc.status.INTERNAL,
      details: "Erreur lors de la mise à jour"
    });
  }
},

  listAllUsers: async (call, callback) => {
    try {
      const { page = 1, limit = 10 } = call.request;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .skip(skip)
        .limit(limit);

      callback(null, { users: users.map(u => u.toObject()) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la récupération"
      });
    }
  }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(userProto.UserService.service, userService);
const port = 50054; // Port différent des autres services
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('Échec de la liaison du serveur:', err);
      return;
    }
    console.log(`Serveur User en écoute sur le port ${port}`);
    server.start();
  });