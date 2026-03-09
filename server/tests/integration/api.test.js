const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');
const Performance = require('../../src/models/Performance');
const SubjectGroup = require('../../src/models/SubjectGroup');
const { createApp } = require('../../src/app');

let mongod;
let app;

const createAdmin = async () => {
  return User.create({
    userId: 'ADMIN001',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
    approvalStatus: 'approved',
    status: 'active',
    authProvider: 'local',
  });
};

const loginAsAdmin = async () => {
  const agent = request.agent(app);
  const response = await agent
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'AdminPass123!' })
    .expect(200);

  return { agent, response };
};

const createStudentPayload = (overrides = {}) => ({
  name: 'Test Student',
  email: 'student1@example.com',
  department: 'Computer Science',
  year: 2,
  password: 'StudentPass123!',
  rollNumber: 'CS24A001',
  ...overrides,
});

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'spid-test' });
  app = createApp();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

describe('API validation and integration flows', () => {
  test('auth flow supports register, admin login, refresh rotation, and logout', async () => {
    await createAdmin();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Viewer User', email: 'viewer@example.com', password: 'ViewerPass123!' })
      .expect(201);

    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.user.approvalStatus).toBe('pending');

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@example.com', password: 'ViewerPass123!' })
      .expect(403);

    const { agent, response: loginResponse } = await loginAsAdmin();
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.token).toBeTruthy();
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    const meResponse = await agent.get('/api/auth/me').expect(200);
    expect(meResponse.body.user.role).toBe('admin');

    const refreshResponse = await agent.post('/api/auth/refresh').expect(200);
    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.token).toBeTruthy();

    await agent.post('/api/auth/logout').expect(200);
    await agent.post('/api/auth/refresh').expect(401);
  });

  test('student creation creates interconnected student and login records', async () => {
    await createAdmin();
    const { agent } = await loginAsAdmin();

    const createResponse = await agent
      .post('/api/students')
      .send(createStudentPayload())
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    const studentId = createResponse.body.data._id;
    expect(studentId).toBeTruthy();

    const studentDoc = await Student.findById(studentId).lean();
    const userDoc = await User.findOne({ email: 'student1@example.com' }).lean();

    expect(studentDoc).toBeTruthy();
    expect(studentDoc.studentId).toMatch(/^STU/);
    expect(studentDoc.semester).toBe(3);
    expect(studentDoc.currentSemester).toBe('Semester 3');
    expect(userDoc).toBeTruthy();
    expect(userDoc.role).toBe('student');

    const profileResponse = await agent.get(`/api/students/${studentId}/profile`).expect(200);
    expect(profileResponse.body.data.semester.label).toBe('Semester 3');
    expect(Array.isArray(profileResponse.body.data.eligibleSubjects)).toBe(true);
  });

  test('subject assignment maps subjects to the matching student cohort', async () => {
    await createAdmin();
    const { agent } = await loginAsAdmin();

    const createResponse = await agent.post('/api/students').send(createStudentPayload()).expect(201);
    const studentObjectId = createResponse.body.data._id;

    await agent
      .post('/api/subjects/assign')
      .send({
        department: 'Computer Science',
        year: 2,
        semester: 3,
        subjects: [
          { code: 'CS301', name: 'Database Systems' },
          { code: 'CS302', name: 'Operating Systems' },
        ],
      })
      .expect(200);

    const subjectGroup = await SubjectGroup.findOne({ department: 'Computer Science', year: 2, semester: 3 }).lean();
    expect(subjectGroup).toBeTruthy();
    expect(subjectGroup.subjects).toHaveLength(2);

    const subjectsResponse = await agent.get(`/api/students/${studentObjectId}/subjects`).expect(200);
    expect(subjectsResponse.body.data.subjects).toHaveLength(2);
    expect(subjectsResponse.body.data.subjects.map((subject) => subject.subjectCode)).toEqual(
      expect.arrayContaining(['CS301', 'CS302'])
    );
  });

  test('performance creation stores linked performance data and blocks invalid payloads', async () => {
    await createAdmin();
    const { agent } = await loginAsAdmin();

    const createResponse = await agent.post('/api/students').send(createStudentPayload()).expect(201);
    const studentObjectId = createResponse.body.data._id;

    await agent
      .post('/api/subjects/assign')
      .send({
        department: 'Computer Science',
        year: 2,
        semester: 3,
        subjects: [{ code: 'CS301', name: 'Database Systems' }],
      })
      .expect(200);

    await agent
      .post('/api/performance')
      .send({
        studentId: studentObjectId,
        subjectName: 'Database Systems',
        attendancePercentage: 88,
        marks: 76,
      })
      .expect(201);

    const performanceDoc = await Performance.findOne({ studentId: studentObjectId }).lean();
    expect(performanceDoc).toBeTruthy();
    expect(performanceDoc.semester).toBe('Semester 3');
    expect(performanceDoc.year).toBe(2);
    expect(performanceDoc.grade).toBe('C');

    await agent
      .post('/api/performance')
      .send({
        studentId: studentObjectId,
        subjectName: 'Database Systems',
        attendancePercentage: 101,
        marks: 76,
      })
      .expect(400);
  });

  test('dashboard metrics reflect inserted performance records', async () => {
    await createAdmin();
    const { agent } = await loginAsAdmin();

    const studentResponse = await agent.post('/api/students').send(createStudentPayload()).expect(201);
    const studentObjectId = studentResponse.body.data._id;

    await agent
      .post('/api/subjects/assign')
      .send({
        department: 'Computer Science',
        year: 2,
        semester: 3,
        subjects: [{ code: 'CS301', name: 'Database Systems' }],
      })
      .expect(200);

    await agent
      .post('/api/performance')
      .send({
        studentId: studentObjectId,
        subjectName: 'Database Systems',
        attendancePercentage: 92,
        marks: 84,
      })
      .expect(201);

    const metricsResponse = await agent.get('/api/dashboard/metrics').expect(200);
    expect(metricsResponse.body.success).toBe(true);
    expect(metricsResponse.body.data.averageMarks).toBeGreaterThan(0);
    expect(metricsResponse.body.data.averageAttendance).toBeGreaterThan(0);
    expect(metricsResponse.body.data.totalStudentsWithPerformance).toBe(1);
    expect(metricsResponse.body.data.topSubject.name).toBe('Database Systems');
  });
});
