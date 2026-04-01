require('dotenv').config();
const connectDB = require('./src/config/database');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Subject = require('./src/models/Subject');
const SubjectGroup = require('./src/models/SubjectGroup');
const Performance = require('./src/models/Performance');
const AcademicRecord = require('./src/models/AcademicRecord');
const { generateId } = require('./src/utils/generateId');

const departments = {
  cse: 'Computer Science',
  it: 'Information Technology',
  ece: 'Electrical and Communication Engineering',
  eee: 'Electrical and Electronic Engineering',
};

const facultyProfiles = [
  {
    name: 'Dr. Meera Natarajan',
    email: 'faculty@spid.com',
    password: 'faculty123',
    registerNumber: 'FAC-CSE-101',
    department: departments.cse,
    designation: 'Professor and Program Lead',
    expertise: ['Database Systems', 'Data Engineering', 'Outcome Analytics'],
    bio: 'Leads the Computer Science academic quality and curriculum alignment initiatives.',
  },
  {
    name: 'Prof. Arjun Rao',
    email: 'arjun.rao@spid.com',
    password: 'faculty123',
    registerNumber: 'FAC-IT-204',
    department: departments.it,
    designation: 'Associate Professor',
    expertise: ['Cloud Computing', 'Cyber Security', 'Web Architecture'],
    bio: 'Oversees modern application delivery, cloud adoption, and student project incubation.',
  },
  {
    name: 'Dr. Kavitha Menon',
    email: 'kavitha.menon@spid.com',
    password: 'faculty123',
    registerNumber: 'FAC-ECE-307',
    department: departments.ece,
    designation: 'Professor',
    expertise: ['Embedded Systems', 'Signal Processing', 'IoT Systems'],
    bio: 'Coordinates capstone delivery and embedded systems assessment across final-year cohorts.',
  },
  {
    name: 'Prof. Nikhil Varma',
    email: 'nikhil.varma@spid.com',
    password: 'faculty123',
    registerNumber: 'FAC-EEE-118',
    department: departments.eee,
    designation: 'Assistant Professor',
    expertise: ['Power Systems', 'Circuit Design', 'Lab Operations'],
    bio: 'Supports practical lab readiness and continuous internal assessment planning.',
  },
];

const subjectBlueprints = [
  {
    department: departments.cse,
    year: 3,
    semester: 5,
    facultyEmail: 'faculty@spid.com',
    subjects: [
      { code: 'CS501', name: 'Database Systems', credits: 4 },
      { code: 'CS502', name: 'Computer Networks', credits: 4 },
      { code: 'CS503', name: 'Software Engineering', credits: 3 },
      { code: 'CS504', name: 'Applied Artificial Intelligence', credits: 3 },
    ],
  },
  {
    department: departments.cse,
    year: 2,
    semester: 3,
    facultyEmail: 'faculty@spid.com',
    subjects: [
      { code: 'CS301', name: 'Data Structures', credits: 4 },
      { code: 'CS302', name: 'Object Oriented Programming', credits: 3 },
      { code: 'CS303', name: 'Discrete Mathematics', credits: 3 },
      { code: 'CS304', name: 'Operating Systems Foundations', credits: 4 },
    ],
  },
  {
    department: departments.it,
    year: 2,
    semester: 4,
    facultyEmail: 'arjun.rao@spid.com',
    subjects: [
      { code: 'IT401', name: 'Web Engineering', credits: 4 },
      { code: 'IT402', name: 'Data Analytics', credits: 3 },
      { code: 'IT403', name: 'Cloud Fundamentals', credits: 3 },
      { code: 'IT404', name: 'Cyber Operations', credits: 4 },
    ],
  },
  {
    department: departments.ece,
    year: 4,
    semester: 7,
    facultyEmail: 'kavitha.menon@spid.com',
    subjects: [
      { code: 'EC701', name: 'Embedded Systems', credits: 4 },
      { code: 'EC702', name: 'Wireless Communication', credits: 4 },
      { code: 'EC703', name: 'VLSI Design', credits: 3 },
      { code: 'EC704', name: 'IoT Integration Lab', credits: 3 },
    ],
  },
];

const studentBlueprints = [
  {
    name: 'Aarya Sharma',
    email: 'aarya.sharma@spid.com',
    password: 'student123',
    department: departments.cse,
    year: 3,
    semester: 5,
    section: 'A',
    status: 'active',
    currentCGPA: 8.92,
    currentAttendance: 91,
    backlogs: 0,
    profileSummary: 'Consistently strong in databases and student leadership activities.',
    tags: ['top-performer', 'mentor'],
  },
  {
    name: 'Rohan Iyer',
    email: 'rohan.iyer@spid.com',
    password: 'student123',
    department: departments.cse,
    year: 3,
    semester: 5,
    section: 'A',
    status: 'active',
    currentCGPA: 7.84,
    currentAttendance: 86,
    backlogs: 0,
    profileSummary: 'Steady performer with improving software engineering outcomes.',
    tags: ['improving'],
  },
  {
    name: 'Nisha Patel',
    email: 'nisha.patel@spid.com',
    password: 'student123',
    department: departments.cse,
    year: 3,
    semester: 5,
    section: 'B',
    status: 'suspended',
    currentCGPA: 5.96,
    currentAttendance: 68,
    backlogs: 2,
    profileSummary: 'Needs intervention on attendance recovery and course completion.',
    tags: ['at-risk', 'attendance-watch'],
  },
  {
    name: 'Dhruv Kapoor',
    email: 'dhruv.kapoor@spid.com',
    password: 'student123',
    department: departments.cse,
    year: 2,
    semester: 3,
    section: 'A',
    status: 'active',
    currentCGPA: 8.31,
    currentAttendance: 88,
    backlogs: 0,
    profileSummary: 'Strong logic foundation and dependable lab participation.',
    tags: ['core-strength'],
  },
  {
    name: 'Ishita Nair',
    email: 'ishita.nair@spid.com',
    password: 'student123',
    department: departments.cse,
    year: 2,
    semester: 3,
    section: 'B',
    status: 'active',
    currentCGPA: 7.22,
    currentAttendance: 79,
    backlogs: 1,
    profileSummary: 'Capable student with uneven performance during exam-heavy periods.',
    tags: ['support-needed'],
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@spid.com',
    password: 'student123',
    department: departments.it,
    year: 2,
    semester: 4,
    section: 'A',
    status: 'active',
    currentCGPA: 8.14,
    currentAttendance: 87,
    backlogs: 0,
    profileSummary: 'Balances web engineering execution with solid collaboration.',
    tags: ['team-project'],
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@spid.com',
    password: 'student123',
    department: departments.it,
    year: 2,
    semester: 4,
    section: 'A',
    status: 'active',
    currentCGPA: 9.08,
    currentAttendance: 94,
    backlogs: 0,
    profileSummary: 'High performer with excellent consistency across practical and theory courses.',
    tags: ['top-performer'],
  },
  {
    name: 'Kiran Joseph',
    email: 'kiran.joseph@spid.com',
    password: 'student123',
    department: departments.it,
    year: 2,
    semester: 4,
    section: 'B',
    status: 'inactive',
    currentCGPA: 6.44,
    currentAttendance: 72,
    backlogs: 2,
    profileSummary: 'Shows promise but has gaps in attendance and submission continuity.',
    tags: ['reactivation-candidate'],
  },
  {
    name: 'Priya Balakrishnan',
    email: 'priya.balakrishnan@spid.com',
    password: 'student123',
    department: departments.ece,
    year: 4,
    semester: 7,
    section: 'A',
    status: 'active',
    currentCGPA: 8.76,
    currentAttendance: 89,
    backlogs: 0,
    profileSummary: 'Final-year student with strong embedded systems project delivery.',
    tags: ['capstone-lead'],
  },
  {
    name: 'Aditya Sen',
    email: 'aditya.sen@spid.com',
    password: 'student123',
    department: departments.ece,
    year: 4,
    semester: 7,
    section: 'A',
    status: 'active',
    currentCGPA: 7.48,
    currentAttendance: 82,
    backlogs: 1,
    profileSummary: 'Practical skills are strong; theory performance needs more consistency.',
    tags: ['lab-strong'],
  },
  {
    name: 'Maya Thomas',
    email: 'maya.thomas@spid.com',
    password: 'student123',
    department: departments.ece,
    year: 4,
    semester: 7,
    section: 'B',
    status: 'active',
    currentCGPA: 6.92,
    currentAttendance: 77,
    backlogs: 1,
    profileSummary: 'Needs support on VLSI and attendance resilience during project weeks.',
    tags: ['watchlist'],
  },
];

function toGrade(marks) {
  if (marks >= 90) return 'A';
  if (marks >= 80) return 'B';
  if (marks >= 70) return 'C';
  if (marks >= 60) return 'D';
  return 'F';
}

function toAcademicGrade(marks) {
  return AcademicRecord.calculateGrade(marks);
}

function semesterLabel(year, semester) {
  return `Y${year}-S${semester}`;
}

function buildHistoricalMarks(baseMarks, semesterOffset, subjectIndex) {
  const adjustment = Math.max(-12, Math.min(12, semesterOffset * 3 - subjectIndex));
  return Math.max(42, Math.min(95, Math.round(baseMarks - adjustment)));
}

async function createUser(payload) {
  const userId = await generateId('userId');
  return User.create({
    userId,
    approvalStatus: 'approved',
    authProvider: 'local',
    ...payload,
  });
}

async function seedDatabase() {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Subject.deleteMany({}),
      SubjectGroup.deleteMany({}),
      Performance.deleteMany({}),
      AcademicRecord.deleteMany({}),
    ]);

    console.log('Cleared existing data');

    const adminUser = await createUser({
      name: 'Admin User',
      email: 'admin@spid.com',
      password: 'admin123',
      role: 'admin',
      registerNumber: 'ADM-001',
      designation: 'System Administrator',
      department: departments.cse,
    });

    await createUser({
      name: 'Pending Viewer',
      email: 'viewer@spid.com',
      password: 'viewer123',
      role: 'viewer',
      approvalStatus: 'pending',
      registerNumber: 'VIEW-001',
      department: departments.it,
      designation: 'Observer',
    });

    const facultyUsers = {};
    for (const profile of facultyProfiles) {
      const faculty = await createUser({
        ...profile,
        role: 'faculty',
        permissions: {
          studentsView: true,
          performanceView: true,
          performanceEdit: true,
          dashboardView: true,
          reportsExport: true,
        },
      });
      facultyUsers[profile.email] = faculty;
    }

    console.log(`Created ${Object.keys(facultyUsers).length + 2} platform users`);

    const subjectLookup = {};
    for (const blueprint of subjectBlueprints) {
      const faculty = facultyUsers[blueprint.facultyEmail];
      const createdSubjects = [];

      for (const entry of blueprint.subjects) {
        const subjectId = await generateId('subjectId');
        const subject = await Subject.create({
          subjectId,
          subjectName: entry.name,
          subjectCode: entry.code,
          credits: entry.credits,
          department: blueprint.department,
          facultyId: faculty ? faculty._id : adminUser._id,
          year: blueprint.year,
          semester: blueprint.semester,
        });
        createdSubjects.push(subject);
      }

      subjectLookup[`${blueprint.department}|${blueprint.year}|${blueprint.semester}`] = createdSubjects;

      await SubjectGroup.create({
        department: blueprint.department,
        year: blueprint.year,
        semester: blueprint.semester,
        subjects: blueprint.subjects.map((entry) => ({ code: entry.code, name: entry.name })),
        createdBy: adminUser.email,
      });
    }

    console.log(`Created ${Object.keys(subjectLookup).length} subject groups and ${Object.values(subjectLookup).flat().length} subjects`);

    const createdStudents = [];
    for (let index = 0; index < studentBlueprints.length; index += 1) {
      const blueprint = studentBlueprints[index];
      await createUser({
        name: blueprint.name,
        email: blueprint.email,
        password: blueprint.password,
        role: 'student',
        registerNumber: `STU-LOGIN-${String(index + 1).padStart(3, '0')}`,
        department: blueprint.department,
        status: blueprint.status === 'suspended' ? 'blocked' : 'active',
      });

      const studentId = await generateId('studentId');
      const rollSuffix = String(index + 1).padStart(3, '0');
      const student = await Student.create({
        studentId,
        name: blueprint.name,
        email: blueprint.email,
        department: blueprint.department,
        year: blueprint.year,
        semester: blueprint.semester,
        currentSemester: String(blueprint.semester),
        status: blueprint.status,
        section: blueprint.section,
        batch: `20${22 - (blueprint.year - 1)}-20${26 - (blueprint.year - 1)}`,
        program: `B.E. ${blueprint.department}`,
        rollNumber: `${blueprint.department.split(' ').map((word) => word[0]).join('').toUpperCase()}${rollSuffix}`,
        phone: `987650${String(1000 + index).slice(-4)}`,
        emergencyContact: `912340${String(1000 + index).slice(-4)}`,
        guardianName: `${blueprint.name.split(' ')[0]}'s Guardian`,
        guardianPhone: `900120${String(1000 + index).slice(-4)}`,
        guardianEmail: `guardian.${blueprint.email}`,
        guardianRelation: 'Parent',
        gender: index % 2 === 0 ? 'Female' : 'Male',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        currentCGPA: blueprint.currentCGPA,
        currentAttendance: blueprint.currentAttendance,
        totalCreditsEarned: Math.max(18, blueprint.year * 20 - blueprint.backlogs * 3),
        backlogs: blueprint.backlogs,
        bio: blueprint.profileSummary,
        tags: blueprint.tags,
        advisorNotes: [
          {
            note:
              blueprint.currentAttendance < 75
                ? 'Needs attendance recovery plan before the next review cycle.'
                : 'Maintaining acceptable academic momentum this term.',
            authorId: adminUser._id,
            authorName: adminUser.name,
            authorRole: 'admin',
          },
        ],
        lastActive: new Date(Date.now() - index * 86400000),
      });

      createdStudents.push({ blueprint, student });
    }

    console.log(`Created ${createdStudents.length} students with login-ready accounts`);

    for (const [studentIndex, entry] of createdStudents.entries()) {
      const { blueprint, student } = entry;
      const currentSubjects = subjectLookup[`${blueprint.department}|${blueprint.year}|${blueprint.semester}`] || [];
      const academicSemesters = [];

      for (let pastSemester = 1; pastSemester <= blueprint.semester; pastSemester += 1) {
        const pastYear = Math.ceil(pastSemester / 2);
        const historyKey = `${blueprint.department}|${pastYear}|${pastSemester}`;
        const semesterSubjects = subjectLookup[historyKey] || currentSubjects;
        const semesterEntries = semesterSubjects.map((subject, subjectIndex) => {
          const referenceMark =
            blueprint.currentCGPA >= 8.5 ? 88 :
            blueprint.currentCGPA >= 7.5 ? 79 :
            blueprint.currentCGPA >= 6.5 ? 70 : 58;
          const marks = buildHistoricalMarks(referenceMark, blueprint.semester - pastSemester, subjectIndex + studentIndex);
          const { grade, gradePoint } = toAcademicGrade(marks);
          return {
            subjectId: subject._id,
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            credits: subject.credits,
            marks,
            grade,
            gradePoint,
            creditPoints: gradePoint * subject.credits,
          };
        });

        const attendancePercentage = Math.max(65, Math.min(96, blueprint.currentAttendance - (blueprint.semester - pastSemester) * 2));
        academicSemesters.push({
          semester: String(pastSemester),
          year: pastYear,
          subjects: semesterEntries,
          totalCredits: 0,
          totalCreditPoints: 0,
          sgpa: 0,
          attendancePercentage,
          status: pastSemester === blueprint.semester ? 'in-progress' : 'completed',
          completedDate: pastSemester === blueprint.semester ? undefined : new Date(2025, pastSemester, 10),
        });
      }

      const academicRecord = new AcademicRecord({
        studentId: student._id,
        semesters: academicSemesters,
        currentSemester: String(blueprint.semester),
        lastUpdated: new Date(),
      });

      academicRecord.semesters.forEach((_, index) => academicRecord.calculateSGPA(index));
      academicRecord.calculateCGPA();
      await academicRecord.save();

      for (const [subjectIndex, subject] of currentSubjects.entries()) {
        const variability = (studentIndex % 3) * 4 - subjectIndex * 2;
        const marks = Math.max(38, Math.min(96, Math.round(blueprint.currentCGPA * 10 + variability)));
        const attendancePercentage = Math.max(58, Math.min(98, blueprint.currentAttendance - subjectIndex * 2 + (studentIndex % 2 ? 2 : -1)));

        await Performance.create({
          studentId: student._id,
          subjectId: subject._id,
          year: blueprint.year,
          subjectName: subject.subjectName,
          attendancePercentage,
          marks,
          grade: toGrade(marks),
          semester: semesterLabel(blueprint.year, blueprint.semester),
        });
      }
    }

    console.log('Created academic records and current-semester performance data');
    console.log('Database seeded successfully');
    console.log('');
    console.log('Demo credentials');
    console.log('Admin   : admin@spid.com / admin123');
    console.log('Faculty : faculty@spid.com / faculty123');
    console.log('Student : aarya.sharma@spid.com / student123');
    console.log('Viewer  : viewer@spid.com / viewer123 (pending approval)');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
