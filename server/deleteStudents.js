require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');

const studentIds = [
  'STU000355', 'STU000354', 'STU000353', 'STU000352', 'STU000351'
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await Student.deleteMany({ studentId: { $in: studentIds } });
    console.log(`Deleted ${result.deletedCount} students`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
