const Department = require('../models/Department');
const Semester = require('../models/Semester');
const Enrollment = require('../models/Enrollment');
const Subject = require('../models/Subject');
const SubjectGroup = require('../models/SubjectGroup');

const codeMap = {
  'Computer Science': 'CS',
  'Information Technology': 'IT',
  'Electrical and Communication Engineering': 'ECE',
  'Electrical and Electronic Engineering': 'EEE',
  Mechanical: 'ME',
  Civil: 'CE',
  Biotechnology: 'BT',
};

const normalizeYear = (value) => {
  const year = Number(value);
  if (!Number.isFinite(year) || year < 1 || year > 4) return 1;
  return year;
};

const inferSemesterNumber = (year, semester, currentSemester) => {
  const numericSemester = Number(semester);
  if (Number.isFinite(numericSemester) && numericSemester >= 1 && numericSemester <= 8) {
    return numericSemester;
  }
  const currentText = String(currentSemester || '').trim();
  const match = currentText.match(/(\d+)/);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 8) return parsed;
  }
  const normalizedYear = normalizeYear(year);
  return ((normalizedYear - 1) * 2) + 1;
};

const ensureDepartment = async (name) => {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return null;
  const code = codeMap[normalizedName] || normalizedName.replace(/[^A-Z]/gi, '').slice(0, 4).toUpperCase() || 'GEN';
  const departmentId = `DEP-${code}`;
  return Department.findOneAndUpdate(
    { name: normalizedName },
    { name: normalizedName, code, departmentId, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const ensureSemester = async (year, semesterNumber) => {
  const normalizedYear = normalizeYear(year);
  const normalizedSemester = inferSemesterNumber(normalizedYear, semesterNumber);
  const semesterId = `SEM-${normalizedYear}-${normalizedSemester}`;
  const label = `Semester ${normalizedSemester}`;
  return Semester.findOneAndUpdate(
    { year: normalizedYear, semesterNumber: normalizedSemester },
    { year: normalizedYear, semesterNumber: normalizedSemester, semesterId, label, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertSubjectsFromGroup = async ({ department, year, semesterNumber }) => {
  const group = await SubjectGroup.findOne({ department, year: normalizeYear(year) }).lean();
  if (!group || !Array.isArray(group.subjects) || !group.subjects.length) return [];

  const docs = [];
  for (const item of group.subjects) {
    const code = String(item.code || '').trim().toUpperCase();
    const name = String(item.name || '').trim();
    if (!code || !name) continue;

    const subjectIdText = `SUB-${code}-${normalizeYear(year)}-${semesterNumber}`;
    const doc = await Subject.findOneAndUpdate(
      { subjectCode: code, department: String(department), year: normalizeYear(year), semester: semesterNumber },
      {
        subjectId: subjectIdText,
        subjectCode: code,
        subjectName: name,
        department: String(department),
        year: normalizeYear(year),
        semester: semesterNumber,
        credits: 3,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    docs.push(doc);
  }
  return docs;
};

const getEligibleSubjects = async ({ department, year, semesterNumber }) => {
  const normalizedYear = normalizeYear(year);
  const normalizedSemester = inferSemesterNumber(normalizedYear, semesterNumber);

  let subjects = await Subject.find({ department, year: normalizedYear, semester: normalizedSemester })
    .select('_id subjectId subjectName subjectCode credits department year semester')
    .lean();

  if (!subjects.length) {
    await upsertSubjectsFromGroup({ department, year: normalizedYear, semesterNumber: normalizedSemester });
    subjects = await Subject.find({ department, year: normalizedYear, semester: normalizedSemester })
      .select('_id subjectId subjectName subjectCode credits department year semester')
      .lean();
  }

  return subjects;
};

const ensureStudentEnrollment = async (student) => {
  const department = await ensureDepartment(student.department);
  const semesterNumber = inferSemesterNumber(student.year, student.semester, student.currentSemester);
  const semester = await ensureSemester(student.year, semesterNumber);
  const subjects = await getEligibleSubjects({
    department: student.department,
    year: student.year,
    semesterNumber,
  });

  const enrollment = await Enrollment.findOneAndUpdate(
    { studentId: student._id, semesterId: semester._id },
    {
      studentId: student._id,
      departmentId: department?._id,
      semesterId: semester._id,
      year: normalizeYear(student.year),
      eligibleSubjectIds: subjects.map((s) => s._id),
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { enrollment, department, semester, eligibleSubjects: subjects };
};

const getStudentConnectedProfile = async (student) => {
  const { enrollment, department, semester, eligibleSubjects } = await ensureStudentEnrollment(student);
  return {
    student: {
      _id: student._id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      department: student.department,
      year: student.year,
      semester: inferSemesterNumber(student.year, student.semester, student.currentSemester),
      currentSemester: student.currentSemester || `Semester ${inferSemesterNumber(student.year, student.semester, student.currentSemester)}`,
      status: student.status,
    },
    department: department ? { _id: department._id, department_id: department.departmentId, name: department.name, code: department.code } : null,
    semester: { _id: semester._id, semester_id: semester.semesterId, semesterNumber: semester.semesterNumber, year: semester.year, label: semester.label },
    enrollment: enrollment ? { _id: enrollment._id, student_id: enrollment.studentId, semester_id: enrollment.semesterId, department_id: enrollment.departmentId, year: enrollment.year, eligibleSubjectIds: enrollment.eligibleSubjectIds } : null,
    eligibleSubjects,
  };
};

module.exports = {
  normalizeYear,
  inferSemesterNumber,
  ensureDepartment,
  ensureSemester,
  ensureStudentEnrollment,
  getEligibleSubjects,
  getStudentConnectedProfile,
};
