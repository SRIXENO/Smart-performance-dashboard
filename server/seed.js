require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Subject = require('./src/models/Subject');
const Performance = require('./src/models/Performance');
const { generateId } = require('./src/utils/generateId');

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Subject.deleteMany({});
    await Performance.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const adminUserId = await generateId('userId');
    const adminUser = await User.create({
      userId: adminUserId,
      name: 'Admin User',
      email: 'admin@spid.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create faculty user
    const facultyUserId = await generateId('userId');
    const facultyUser = await User.create({
      userId: facultyUserId,
      name: 'Dr. John Smith',
      email: 'faculty@spid.com',
      password: 'faculty123',
      role: 'faculty'
    });

    console.log('Created users');

    // Create subjects
    const subjects = [];
    const subjectData = [
      { name: 'Data Structures', code: 'CS101', credits: 4, department: 'Computer Science' },
      { name: 'Database Systems', code: 'CS201', credits: 3, department: 'Computer Science' },
      { name: 'Web Development', code: 'IT101', credits: 3, department: 'Information Technology' },
      { name: 'Network Security', code: 'IT201', credits: 4, department: 'Information Technology' },
      { name: 'Digital Electronics', code: 'EC101', credits: 3, department: 'Electronics' }
    ];

    for (const sub of subjectData) {
      const subjectId = await generateId('subjectId');
      const subject = await Subject.create({
        subjectId,
        subjectName: sub.name,
        subjectCode: sub.code,
        credits: sub.credits,
        department: sub.department,
        facultyId: facultyUser._id
      });
      subjects.push(subject);
    }

    console.log('Created subjects');

    // Skip creating students and performance records
    console.log('Skipped creating students (add manually via UI)');
    console.log('Skipped creating performance records (add manually via UI)');
    
    console.log('Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@spid.com / admin123');
    console.log('Faculty: faculty@spid.com / faculty123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();