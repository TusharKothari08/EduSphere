const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Copy server/.env.example to server/.env.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  // Preserve existing users and their current roles.
  // Mark only records without roleAssigned as already assigned.
  const usersCollection = mongoose.connection.collection('users');

  const migration = await usersCollection.updateMany(
    { roleAssigned: { $exists: false } },
    { $set: { roleAssigned: true } }
  );

  console.log(
    `Existing-user role migration completed: ${migration.modifiedCount} accounts updated.`
  );
}

module.exports = connectDatabase;