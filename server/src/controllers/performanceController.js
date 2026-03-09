const Performance = require('../models/Performance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { getStudentConnectedProfile } = require('../services/academicDataService');
const { upsertGlobalCache, upsertStudentCache } = require('../services/analyticsService');

const getPerformance = async (req, res) => {
  try {
    const { studentId, subjectId, semester } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (semester) query.semester = semester;

    const records = await Performance.find(query)
      .populate('studentId', 'name studentId department year semester currentSemester')
      .populate('subjectId', 'subjectName subjectCode')
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
    
    // Calculate grade
    let grade = 'F';
    const marksValue = parseFloat(marks);
    if (marksValue >= 90) grade = 'A';
    else if (marksValue >= 80) grade = 'B';
    else if (marksValue >= 70) grade = 'C';
    else if (marksValue >= 60) grade = 'D';

    const updatePayload = {
      ...req.body,
      attendancePercentage: parseFloat(attendancePercentage),
      marks: marksValue,
      grade,
      lastUpdated: new Date()
    };

    if (subjectId) {
      const subjectDoc = await Subject.findById(subjectId).lean();
      if (!subjectDoc) {
        return res.status(404).json({ success: false, error: 'Subject not found' });
      }
      updatePayload.subjectId = subjectDoc._id;
      updatePayload.subjectName = subjectDoc.subjectName;
    }

    const updated = await Performance.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Performance record not found' });
    }
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

module.exports = { getPerformance, createPerformance, updatePerformance, deletePerformance };
