const mongoose = require('mongoose');

let cachedConnectionPromise;

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const error = new Error(
      'MongoDB connection requires the MONGODB_URI environment variable to be set.'
    );
    error.statusCode = 500;
    throw error;
  }
  return uri;
}

async function connectMongoose() {
  if (!cachedConnectionPromise) {
    mongoose.set('strictQuery', true);
    const dbName = process.env.MONGODB_DB || 'bluffly';

    cachedConnectionPromise = mongoose
      .connect(getMongoUri(), { dbName })
      .catch((error) => {
        cachedConnectionPromise = undefined;
        throw error;
      });
  }

  await cachedConnectionPromise;
  return mongoose.connection;
}

async function disconnectMongoose() {
  if (!cachedConnectionPromise) {
    return;
  }

  await mongoose.disconnect();
  cachedConnectionPromise = undefined;
}

module.exports = {
  connectMongoose,
  disconnectMongoose
};
