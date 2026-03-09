const Performance = require('../models/Performance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { getStudentConnectedProfile } = require('../services/academicDataService');
const { upsertGlobalCache, upsertStudentCache } = require('../services/analyticsService');

const buildMissingSummary = async ({ limit = 200, studentIds = null } = {}) => {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 200;
  const studentQuery = {};
  if (Array.isArray(studentIds) && studentIds.length) {
    studentQuery._id = { $in: studentIds };
  }

  const students = await Student.find(studentQuery)
    .select('_id studentId name department year semester currentSemester status createdAt')
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  if (!students.length) {
    return {
      summary: {
        totalStudentsScanned: 0,
        totalMissing: 0,
        finalYearMissing: 0,
        noEligibleSubjects: 0,
      },
      students: [],
    };
  }

  const perfCounts = await Performance.aggregate([
    { $match: { studentId: { $in: students.map((s) => s._id) } } },
    { $group: { _id: '$studentId', count: { $sum: 1 }, latestAt: { $max: '$lastUpdated' } } },
  ]);
  const perfMap = new Map(perfCounts.map((item) => [String(item._id), item]));

  const missingRows = [];
  for (const student of students) {
    const perfInfo = perfMap.get(String(student._id));
    if (perfInfo?.count > 0) continue;
    const profile = await getStudentConnectedProfile(student);
    const eligibleSubjects = profile?.eligibleSubjects || [];
    missingRows.push({
      _id: student._id,
      studentId: student.studentId,
      name: student.name,
      department: student.department,
      year: student.year,
      semester: profile?.semester?.label || student.currentSemester || `Semester ${student.semester || 1}`,
      eligibleSubjectCount: eligibleSubjects.length,
      hasEligibleSubjects: eligibleSubjects.length > 0,
      createdAt: student.createdAt,
      reasons: [
        eligibleSubjects.length === 0 ? 'No subjects assigned for enrollment' : 'No performance record yet',
      ],
    });
  }

  return {
    summary: {
      totalStudentsScanned: students.length,
      totalMissing: missingRows.length,
      finalYearMissing: missingRows.filter((item) => Number(item.year) === 4).length,
      noEligibleSubjects: missingRows.filter((item) => !item.hasEligibleSubjects).length,
    },
    students: missingRows,
  };
};

const getPerformance = async (req, res) => {
  try {
    const { studentId, subjectId, semester } = req.query;
    const limitRaw = Number(req.query.limit || 500);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, Math.floor(limitRaw))) : 500;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (semester) query.semester = semester;

    const records = await Performance.find(query)
      .populate('studentId', 'name studentId department year semester currentSemester')
      .populate('subjectId', 'subjectName subjectCode')
      .limit(limit)
      .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      data: { records }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createPerformance = async (req, res) => {
  try {
    const { studentId, subjectId, subjectName, attendancePercentage, marks } = req.body;
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const profile = await getStudentConnectedProfile(student);
    const eligibleSubjects = profile.eligibleSubjects || [];

    let selectedSubject = null;
    if (subjectId) {
      selectedSubject = eligibleSubjects.find((item) => String(item._id) === String(subjectId))
        || await Subject.findById(subjectId).lean();
    }

    if (!selectedSubject && subjectName) {
      const targetName = String(subjectName).trim().toLowerCase();
      selectedSubject = eligibleSubjects.find((item) => String(item.subjectName || '').trim().toLowerCase() === targetName)
        || await Subject.findOne({
          department: student.department,
          year: student.year,
          subjectName: new RegExp(`^${String(subjectName).trim()}$`, 'i')
        }).lean();
    }

    if (!selectedSubject) {
      return res.status(400).json({ success: false, error: 'Valid subject is required for selected student/semester' });
    }

    const isEligible = eligibleSubjects.some((item) => String(item._id) === String(selectedSubject._id));
    if (!isEligible) {
      return res.status(400).json({ success: false, error: 'Selected subject is not mapped to the student current enrollment' });
    }

    const semesterLabel = profile.semester?.label || student.currentSemester || `Semester ${student.semester || 1}`;

    const duplicate = await Performance.findOne({
      studentId,
      subjectId: selectedSubject._id,
      semesterId: profile.semester?._id
    }).lean();
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'Performance already exists for this student, subject, and semester' });
    }

    // Calculate grade
    let grade = 'F';
    if (marks >= 90) grade = 'A';
    else if (marks >= 80) grade = 'B';
    else if (marks >= 70) grade = 'C';
    else if (marks >= 60) grade = 'D';

    const newRecord = new Performance({
      studentId,
      subjectId: selectedSubject._id,
      subjectName: selectedSubject.subjectName || subjectName,
      attendancePercentage: parseFloat(attendancePercentage),
      marks: parseFloat(marks),
      grade,
      semester: semesterLabel,
      semesterId: profile.semester?._id,
      departmentId: profile.department?._id,
      year: student.year,
      lastUpdated: new Date()
    });

    await newRecord.save();
    await Promise.all([
      upsertStudentCache(studentId),
      upsertGlobalCache(),
    ]);

    res.status(201).json({
      success: true,
      message: 'Performance record created successfully',
      data: await newRecord.populate([
        { path: 'studentId', select: 'name studentId department year semester currentSemester' },
        { path: 'subjectId', select: 'subjectName subjectCode' }
      ])
    });
  } catch (error) {
    console.error('Create performance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePerformance = async (req, res) => {
  try {
    const { attendancePercentage, marks, subjectId } = req.body;
    const existing = await Performance.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Performance record not found' });
    }

    const student = await Student.findById(existing.studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found for this performance record' });
    }

    const profile = await getStudentConnectedProfile(student);
    const resolvedAttendance = attendancePercentage !== undefined ? Number(attendancePercentage) : Number(existing.attendancePercentage);
    const resolvedMarks = marks !== undefined ? Number(marks) : Number(existing.marks);
    if (!Number.isFinite(resolvedAttendance) || resolvedAttendance < 0 || resolvedAttendance > 100) {
      return res.status(400).json({ success: false, error: 'Attendance must be between 0 and 100' });
    }
    if (!Number.isFinite(resolvedMarks) || resolvedMarks < 0 || resolvedMarks > 100) {
      return res.status(400).json({ success: false, error: 'Marks must be between 0 and 100' });
    }

    const updatePayload = {
      attendancePercentage: resolvedAttendance,
      marks: resolvedMarks,
      grade: resolvedMarks >= 90 ? 'A' : resolvedMarks >= 80 ? 'B' : resolvedMarks >= 70 ? 'C' : resolvedMarks >= 60 ? 'D' : 'F',
      semester: profile.semester?.label || student.currentSemester || existing.semester || `Semester ${student.semester || 1}`,
      semesterId: profile.semester?._id || existing.semesterId || null,
      departmentId: profile.department?._id || existing.departmentId || null,
      year: student.year,
      lastUpdated: new Date()
    };

    const eligibleSubjects = profile.eligibleSubjects || [];
    if (subjectId) {
      const subjectDoc = eligibleSubjects.find((item) => String(item._id) === String(subjectId))
        || await Subject.findById(subjectId).lean();
      if (!subjectDoc) {
        return res.status(404).json({ success: false, error: 'Subject not found' });
      }
      const isEligible = eligibleSubjects.some((item) => String(item._id) === String(subjectDoc._id));
      if (!isEligible) {
        return res.status(400).json({ success: false, error: 'Selected subject is not mapped to the student current enrollment' });
      }
      updatePayload.subjectId = subjectDoc._id;
      updatePayload.subjectName = subjectDoc.subjectName;
    }

    const duplicate = await Performance.findOne({
      _id: { $ne: existing._id },
      studentId: existing.studentId,
      subjectId: updatePayload.subjectId || existing.subjectId,
      semesterId: updatePayload.semesterId || existing.semesterId,
    }).lean();
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'Performance already exists for this student, subject, and semester' });
    }

    const updated = await Performance.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );
    await Promise.all([
      upsertStudentCache(updated.studentId),
      upsertGlobalCache(),
    ]);

    res.json({
      success: true,
      message: 'Performance record updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deletePerformance = async (req, res) => {
  try {
    const deleted = await Performance.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Performance record not found' });
    }

    await Promise.all([
      upsertStudentCache(deleted.studentId),
      upsertGlobalCache(),
    ]);

    res.json({ success: true, message: 'Performance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMissingPerformanceSummary = async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit || 200);
    const data = await buildMissingSummary({ limit: limitRaw });
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const bootstrapMissingPerformance = async (req, res) => {
  try {
    const {
      studentIds = [],
      dryRun = false,
      marks = 70,
      attendancePercentage = 85,
      perStudentMaxSubjects = 1,
      limit = 100,
    } = req.body || {};

    const selectedIds = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];
    const summary = await buildMissingSummary({
      limit: Number(limit) || 100,
      studentIds: selectedIds.length ? selectedIds : null,
    });

    const marksNum = Number(marks);
    const attendanceNum = Number(attendancePercentage);
    const maxSubjects = Math.max(1, Math.min(6, Number(perStudentMaxSubjects) || 1));
    const normalizedMarks = Number.isFinite(marksNum) ? Math.max(0, Math.min(100, marksNum)) : 70;
    const normalizedAttendance = Number.isFinite(attendanceNum) ? Math.max(0, Math.min(100, attendanceNum)) : 85;
    const grade = normalizedMarks >= 90 ? 'A' : normalizedMarks >= 80 ? 'B' : normalizedMarks >= 70 ? 'C' : normalizedMarks >= 60 ? 'D' : 'F';

    const createdDocs = [];
    const skipped = [];
    const touchedStudentIds = new Set();

    for (const row of summary.students) {
      const student = await Student.findById(row._id).lean();
      if (!student) {
        skipped.push({ studentId: row.studentId, reason: 'Student not found' });
        continue;
      }

      const profile = await getStudentConnectedProfile(student);
      const semesterLabel = profile.semester?.label || student.currentSemester || `Semester ${student.semester || 1}`;
      const eligibleSubjects = (profile.eligibleSubjects || []).slice(0, maxSubjects);
      if (!eligibleSubjects.length) {
        skipped.push({ studentId: row.studentId, reason: 'No eligible subjects' });
        continue;
      }

      for (const subj of eligibleSubjects) {
        createdDocs.push({
          studentId: student._id,
          subjectId: subj._id,
          subjectName: subj.subjectName,
          attendancePercentage: normalizedAttendance,
          marks: normalizedMarks,
          grade,
          semester: semesterLabel,
          semesterId: profile.semester?._id,
          departmentId: profile.department?._id,
          year: student.year,
          lastUpdated: new Date(),
        });
      }
      touchedStudentIds.add(String(student._id));
    }

    if (dryRun) {
      return res.json({
        success: true,
        data: {
          dryRun: true,
          candidates: summary.students.length,
          recordsToCreate: createdDocs.length,
          skipped,
        },
      });
    }

    let inserted = [];
    if (createdDocs.length) {
      inserted = await Performance.insertMany(createdDocs, { ordered: false }).catch((error) => {
        const insertedDocs = error?.insertedDocs || [];
        return insertedDocs;
      });
    }

    if (inserted.length) {
      await upsertGlobalCache();
      await Promise.all(Array.from(touchedStudentIds).map((id) => upsertStudentCache(id)));
    }

    return res.status(201).json({
      success: true,
      message: inserted.length ? 'Baseline performance records created' : 'No records created',
      data: {
        candidates: summary.students.length,
        recordsCreated: inserted.length,
        skipped,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getPerformance,
  createPerformance,
  updatePerformance,
  deletePerformance,
  getMissingPerformanceSummary,
  bootstrapMissingPerformance,
};
