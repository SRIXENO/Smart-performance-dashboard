const { Readable } = require('stream');
const csv = require('csv-parser');
const Student = require('../models/Student');
const Performance = require('../models/Performance');
const Subject = require('../models/Subject');
const { getStudentConnectedProfile } = require('./academicDataService');

const parseCsvBuffer = async (buffer) => {
  const rows = [];
  await new Promise((resolve, reject) => {
    Readable.from(buffer)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  return rows;
};

const parseNumberInRange = (value, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
};

const normalizePreviewRow = (row = {}) => ({
  studentId: String(row.studentId || row.student_id || row.registerNumber || '').trim(),
  subjectCode: String(row.subjectCode || row.subject_code || '').trim().toUpperCase(),
  attendancePercentage: String(row.attendancePercentage || row.attendance || '').trim(),
  marks: String(row.marks || row.score || '').trim(),
  semester: String(row.semester || '').trim(),
});

const validatePerformanceImportRows = async (rawRows = []) => {
  const normalizedRows = rawRows.map(normalizePreviewRow);
  const studentIds = Array.from(new Set(normalizedRows.map((row) => row.studentId).filter(Boolean)));
  const studentDocs = await Student.find({ studentId: { $in: studentIds } })
    .select('_id studentId name department year semester currentSemester')
    .lean();
  const studentMap = new Map(studentDocs.map((student) => [String(student.studentId), student]));

  const results = [];
  const duplicateGuard = new Set();

  for (let index = 0; index < normalizedRows.length; index += 1) {
    const row = normalizedRows[index];
    const rowNumber = index + 2;
    const errors = [];
    const student = studentMap.get(row.studentId);

    if (!row.studentId) errors.push('studentId is required');
    if (!row.subjectCode) errors.push('subjectCode is required');

    const attendance = parseNumberInRange(row.attendancePercentage, 0, 100);
    const marks = parseNumberInRange(row.marks, 0, 100);
    if (attendance === null) errors.push('attendancePercentage must be between 0 and 100');
    if (marks === null) errors.push('marks must be between 0 and 100');

    if (!student) {
      errors.push('Student not found');
      results.push({
        rowNumber,
        source: row,
        valid: false,
        errors,
      });
      continue;
    }

    const profile = await getStudentConnectedProfile(student);
    const semesterLabel = profile?.semester?.label || student.currentSemester || `Semester ${student.semester || 1}`;
    if (row.semester && row.semester !== semesterLabel) {
      errors.push(`Semester mismatch. Expected ${semesterLabel}`);
    }

    const eligibleSubjects = profile?.eligibleSubjects || [];
    const subject = eligibleSubjects.find((item) => String(item.subjectCode || '').toUpperCase() === row.subjectCode)
      || await Subject.findOne({
        subjectCode: row.subjectCode,
        department: student.department,
        year: student.year,
        semester: profile?.semester?.semesterNumber || student.semester,
      }).lean();

    if (!subject) {
      errors.push('Subject not mapped to student department/year/semester');
    }

    const importKey = `${student._id}:${subject?._id || row.subjectCode}:${profile?.semester?._id || semesterLabel}`;
    if (duplicateGuard.has(importKey)) {
      errors.push('Duplicate row found in CSV');
    } else {
      duplicateGuard.add(importKey);
    }

    if (subject) {
      const existing = await Performance.findOne({
        studentId: student._id,
        subjectId: subject._id,
        semesterId: profile?.semester?._id,
      }).select('_id').lean();
      if (existing) errors.push('Performance already exists in database');
    }

    results.push({
      rowNumber,
      source: row,
      valid: errors.length === 0,
      errors,
      normalized: errors.length === 0 ? {
        studentObjectId: String(student._id),
        studentId: student.studentId,
        studentName: student.name,
        department: student.department,
        year: student.year,
        semester: semesterLabel,
        semesterId: profile?.semester?._id ? String(profile.semester._id) : null,
        departmentId: profile?.department?._id ? String(profile.department._id) : null,
        subjectId: subject?._id ? String(subject._id) : null,
        subjectCode: subject?.subjectCode || row.subjectCode,
        subjectName: subject?.subjectName || '',
        attendancePercentage: attendance,
        marks,
      } : null,
    });
  }

  const validRows = results.filter((item) => item.valid).map((item) => item.normalized);
  const invalidRows = results.filter((item) => !item.valid);
  return {
    rows: results,
    validRows,
    invalidRows,
    summary: {
      totalRows: results.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
    },
  };
};

const buildRejectReportCsv = (invalidRows = []) => {
  const header = ['rowNumber', 'studentId', 'subjectCode', 'attendancePercentage', 'marks', 'semester', 'errors'];
  const lines = invalidRows.map((row) => [
    row.rowNumber,
    row.source?.studentId || '',
    row.source?.subjectCode || '',
    row.source?.attendancePercentage || '',
    row.source?.marks || '',
    row.source?.semester || '',
    row.errors.join(' | '),
  ]);
  return [header, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

module.exports = {
  parseCsvBuffer,
  validatePerformanceImportRows,
  buildRejectReportCsv,
};
