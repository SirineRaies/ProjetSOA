const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const userProtoPath = './Protos/User.proto';
const userProtoDefinition = protoLoader.loadSync(userProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(userProtoDefinition).user;

const userResolvers = {
  Query: {
    user: (_, { id }) => {
      const client = new userProto.UserService('localhost:50054',
        grpc.credentials.createInsecure());
      return new Promise((resolve, reject) => {
        client.getUser({ user_id: id }, (err, response) => {
          err ? reject(err) : resolve(response.user);
        });
      });
    },
    users: () => {
      const client = new userProto.UserService('localhost:50054',
        grpc.credentials.createInsecure());
      return new Promise((resolve, reject) => {
        client.listAllUsers({}, (err, response) => {
          err ? reject(err) : resolve(response.users);
        });
      });
    }
  },
  Mutation: {
    createUser: (_, { name }) => {
      const client = new userProto.UserService('localhost:50054',
        grpc.credentials.createInsecure());
      return new Promise((resolve, reject) => {
        client.createUser({ name }, (err, response) => {
          err ? reject(err) : resolve(response.user);
        });
      });
    },
    updateUserName: (_, { id, newName }) => {
      const client = new userProto.UserService('localhost:50054',
        grpc.credentials.createInsecure());
      return new Promise((resolve, reject) => {
        client.updateUserName({ user_id: id, new_name: newName }, (err, response) => {
          err ? reject(err) : resolve(response.user);
        });
      });
    }
  }
};

module.exports = userResolvers;