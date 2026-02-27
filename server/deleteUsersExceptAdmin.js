require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const ADMIN_EMAIL = 'admin@xeno.com';

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    throw new Error(`Admin user not found: ${ADMIN_EMAIL}`);
  }

  const result = await User.deleteMany({
    email: { $ne: ADMIN_EMAIL.toLowerCase() },
  });

  console.log(`Deleted ${result.deletedCount} users`);
  console.log(`Kept admin: ${ADMIN_EMAIL}`);
}

main()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Error:', err.message || err);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  });
