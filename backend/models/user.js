const { Schema, model } = require('mongoose');

const collectionName = process.env.MONGODB_USERS_COLLECTION || 'users';


const userSchema = new Schema(
  {
    authProvider: { type: String, required: true, enum: ['google', 'local', 'microsoft'] },
    providerId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' }
  },
  {
    versionKey: false
  }
);

userSchema.index({ authProvider: 1, providerId: 1 }, { unique: true });

module.exports = model('User', userSchema, collectionName);
