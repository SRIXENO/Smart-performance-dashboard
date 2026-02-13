const SubjectGroup = require('../models/SubjectGroup');
const Student = require('../models/Student');

exports.assignSubjects = async (req, res) => {
  try {
    const { department, year, subjects } = req.body;

    if (!department || !year || !subjects || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Department, year, and subjects are required' });
    }

    const subjectGroup = await SubjectGroup.findOneAndUpdate(
      { department, year },
      { department, year, subjects },
      { new: true, upsert: true, runValidators: true }
    );

    const subjectNames = subjects.map(s => s.name);
    await Student.updateMany(
      { department, year },
      { $set: { subjects: subjectNames } }
    );

    res.status(200).json({
      success: true,
      message: `Subjects assigned successfully to all ${department} Year ${year} students`,
      data: { subjectGroup }
    });
  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubjectGroups = async (req, res) => {
  try {
    const subjectGroups = await SubjectGroup.find().sort({ department: 1, year: 1 });
    res.status(200).json({ success: true, data: { subjectGroups } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubjectGroupByDeptYear = async (req, res) => {
  try {
    const { department, year } = req.params;
    const subjectGroup = await SubjectGroup.findOne({ department, year: parseInt(year) });
    
    if (!subjectGroup) {
      return res.status(200).json({ 
        success: true, 
        data: { subjectGroup: null },
        message: 'No subjects assigned for this department and year'
      });
    }

    res.status(200).json({ success: true, data: { subjectGroup } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentSubjects = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const subjectGroup = await SubjectGroup.findOne({ 
      department: student.department, 
      year: student.year 
    });

    if (!subjectGroup) {
      return res.status(200).json({ 
        success: true, 
        data: { subjects: [], message: 'No subjects assigned for this department and year' } 
      });
    }

    res.status(200).json({ success: true, data: { subjects: subjectGroup.subjects } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSubjectGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjects } = req.body;

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Subjects are required' });
    }

    const subjectGroup = await SubjectGroup.findByIdAndUpdate(
      id,
      { subjects },
      { new: true, runValidators: true }
    );

    if (!subjectGroup) {
      return res.status(404).json({ success: false, message: 'Subject group not found' });
    }

    const subjectNames = subjects.map(s => s.name);
    await Student.updateMany(
      { department: subjectGroup.department, year: subjectGroup.year },
      { $set: { subjects: subjectNames } }
    );

    res.status(200).json({
      success: true,
      message: `Subjects updated successfully for all ${subjectGroup.department} Year ${subjectGroup.year} students`,
      data: { subjectGroup }
    });
  } catch (error) {
    console.error('Update subjects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSubjectGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const subjectGroup = await SubjectGroup.findByIdAndDelete(id);

    if (!subjectGroup) {
      return res.status(404).json({ success: false, message: 'Subject group not found' });
    }

    await Student.updateMany(
      { department: subjectGroup.department, year: subjectGroup.year },
      { $set: { subjects: [] } }
    );

    res.status(200).json({ success: true, message: 'Subject group deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
