const User = require('../models/user');
const { connectMongoose } = require('./mongoClient');

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

exports.findOrCreateOAuthUser = async ({ authProvider, providerId, email, name }) => {
  const safeProvider = sanitizeString(authProvider).toLowerCase();
  const safeProviderId = sanitizeString(providerId);
  const safeEmail = sanitizeString(email).toLowerCase();
  const safeName = sanitizeString(name);

  if (!safeProvider || !safeProviderId) {
    const error = new Error('A valid authentication provider and identifier are required.');
    error.statusCode = 400;
    throw error;
  }

  await connectMongoose();

  const user = await User.findOneAndUpdate(
    { authProvider: safeProvider, providerId: safeProviderId },
    {
      $set: {
        email: safeEmail,
        name: safeName
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).exec();

  return user;
};

exports.findUserById = async userId => {
  const safeId = sanitizeString(userId);
  if (!safeId) {
    return null;
  }

  await connectMongoose();
  return User.findById(safeId).lean().exec();
};
