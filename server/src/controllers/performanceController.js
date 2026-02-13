const Performance = require('../models/Performance');
const Student = require('../models/Student');

const getPerformance = async (req, res) => {
  try {
    const { studentId, subjectId, semester } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (semester) query.semester = semester;

    const records = await Performance.find(query)
      .populate('studentId', 'name studentId department year')
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
    const { studentId, subjectId, subjectName, attendancePercentage, marks, semester } = req.body;

    // Calculate grade
    let grade = 'F';
    if (marks >= 90) grade = 'A';
    else if (marks >= 80) grade = 'B';
    else if (marks >= 70) grade = 'C';
    else if (marks >= 60) grade = 'D';

    const newRecord = new Performance({
      studentId,
      subjectId,
      subjectName,
      attendancePercentage: parseFloat(attendancePercentage),
      marks: parseFloat(marks),
      grade,
      semester,
      lastUpdated: new Date()
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Performance record created successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Create performance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePerformance = async (req, res) => {
  try {
    const { attendancePercentage, marks } = req.body;
    
    // Calculate grade
    let grade = 'F';
    const marksValue = parseFloat(marks);
    if (marksValue >= 90) grade = 'A';
    else if (marksValue >= 80) grade = 'B';
    else if (marksValue >= 70) grade = 'C';
    else if (marksValue >= 60) grade = 'D';

    const updated = await Performance.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        attendancePercentage: parseFloat(attendancePercentage),
        marks: marksValue,
        grade,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Performance record not found' });
    }

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

    res.json({ success: true, message: 'Performance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getPerformance, createPerformance, updatePerformance, deletePerformance };