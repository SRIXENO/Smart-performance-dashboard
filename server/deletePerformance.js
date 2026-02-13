require('dotenv').config();
const mongoose = require('mongoose');
const Performance = require('./src/models/Performance');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await Performance.deleteMany({});
    console.log(`Deleted ${result.deletedCount} performance records`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
