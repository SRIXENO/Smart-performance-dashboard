require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const Performance = require('./src/models/Performance');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const studentResult = await Student.deleteMany({});
    const performanceResult = await Performance.deleteMany({});
    console.log(`Deleted ${studentResult.deletedCount} students`);
    console.log(`Deleted ${performanceResult.deletedCount} performance records`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
