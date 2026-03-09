const SubjectGroup = require('../models/SubjectGroup');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { inferSemesterNumber, ensureStudentEnrollment } = require('../services/academicDataService');

const syncSubjectsToCatalog = async ({ department, year, semester, subjects }) => {
  const resolvedSemester = inferSemesterNumber(year, semester);
  for (const item of subjects) {
    const code = String(item.code || '').trim().toUpperCase();
    const name = String(item.name || '').trim();
    if (!code || !name) continue;
    const payload = {
      subjectId: `SUB-${code}-${year}-${resolvedSemester}`,
      subjectName: name,
      subjectCode: code,
      department,
      year,
      semester: resolvedSemester,
      credits: 3,
    };
    try {
      await Subject.findOneAndUpdate(
        { subjectCode: code, department, year, semester: resolvedSemester },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      // Backward compatibility for deployments where a legacy unique index on subjectCode still exists.
      if (error?.code === 11000 && String(error?.message || '').includes('subjectCode')) {
        await Subject.findOneAndUpdate(
          { subjectCode: code },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        throw error;
      }
    }
  }
};

const syncEnrollmentsForDepartmentYearSemester = async (department, year, semester) => {
  const students = await Student.find({ department, year, semester }).select('_id studentId name email department year semester currentSemester status').lean();
  for (const student of students) {
    await ensureStudentEnrollment(student);
  }
};

exports.assignSubjects = async (req, res) => {
  try {
    const { department, year, semester, subjects } = req.body;
    const resolvedSemester = inferSemesterNumber(year, semester);

    if (!department || !year || !semester || !subjects || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Department, year, semester, and subjects are required' });
    }

    const subjectGroup = await SubjectGroup.findOneAndUpdate(
      { department, year, semester: resolvedSemester },
      { department, year, semester: resolvedSemester, subjects },
      { new: true, upsert: true, runValidators: true }
    );
    await syncSubjectsToCatalog({ department, year, semester: resolvedSemester, subjects });

    const subjectNames = subjects.map(s => s.name);
    await Student.updateMany(
      { department, year, semester: resolvedSemester },
      { $set: { subjects: subjectNames } }
    );
    await syncEnrollmentsForDepartmentYearSemester(department, year, resolvedSemester);

    res.status(200).json({
      success: true,
      message: `Subjects assigned successfully to all ${department} Year ${year} Semester ${resolvedSemester} students`,
      data: { subjectGroup }
    });
  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubjectGroups = async (req, res) => {
  try {
    const subjectGroups = await SubjectGroup.find().sort({ department: 1, year: 1, semester: 1 });
    res.status(200).json({ success: true, data: { subjectGroups } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubjectGroupByDeptYear = async (req, res) => {
  try {
    const { department, year } = req.params;
    const semesterFromQuery = Number(req.query.semester);
    const resolvedSemester = inferSemesterNumber(year, semesterFromQuery);
    const subjectGroup = await SubjectGroup.findOne({ department, year: parseInt(year), semester: resolvedSemester });
    
    if (!subjectGroup) {
      return res.status(200).json({ 
        success: true, 
        data: { subjectGroup: null },
        message: 'No subjects assigned for this department/year/semester'
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
      year: student.year,
      semester: inferSemesterNumber(student.year, student.semester, student.currentSemester)
    });

    if (!subjectGroup) {
      return res.status(200).json({ 
        success: true, 
        data: { subjects: [], message: 'No subjects assigned for this department/year/semester' } 
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

    await syncSubjectsToCatalog({ department: subjectGroup.department, year: subjectGroup.year, semester: subjectGroup.semester, subjects });

    const subjectNames = subjects.map(s => s.name);
    await Student.updateMany(
      { department: subjectGroup.department, year: subjectGroup.year, semester: subjectGroup.semester },
      { $set: { subjects: subjectNames } }
    );
    await syncEnrollmentsForDepartmentYearSemester(subjectGroup.department, subjectGroup.year, subjectGroup.semester);

    res.status(200).json({
      success: true,
      message: `Subjects updated successfully for all ${subjectGroup.department} Year ${subjectGroup.year} Semester ${subjectGroup.semester} students`,
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
      { department: subjectGroup.department, year: subjectGroup.year, semester: subjectGroup.semester },
      { $set: { subjects: [] } }
    );

    res.status(200).json({ success: true, message: 'Subject group deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
