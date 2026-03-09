const multer = require('multer');
const Performance = require('../models/Performance');
const ActivityLog = require('../models/ActivityLog');
const { upsertGlobalCache, upsertStudentCache } = require('../services/analyticsService');
const { parseCsvBuffer, validatePerformanceImportRows, buildRejectReportCsv } = require('../services/importService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const previewPerformanceImport = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const rows = await parseCsvBuffer(req.file.buffer);
    const preview = await validatePerformanceImportRows(rows);
    return res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const commitPerformanceImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const partial = req.body?.partial !== false;

    if (!rows.length) {
      return res.status(400).json({ success: false, error: 'No rows provided for import' });
    }

    const preview = await validatePerformanceImportRows(rows);
    if (!partial && preview.invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Import contains invalid rows',
        data: {
          summary: preview.summary,
          rejectReportCsv: buildRejectReportCsv(preview.invalidRows),
        },
      });
    }

    const docs = preview.validRows.map((row) => ({
      studentId: row.studentObjectId,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      attendancePercentage: row.attendancePercentage,
      marks: row.marks,
      grade: row.marks >= 90 ? 'A' : row.marks >= 80 ? 'B' : row.marks >= 70 ? 'C' : row.marks >= 60 ? 'D' : 'F',
      semester: row.semester,
      semesterId: row.semesterId,
      departmentId: row.departmentId,
      year: row.year,
      lastUpdated: new Date(),
    }));

    let inserted = [];
    if (docs.length) {
      inserted = await Performance.insertMany(docs, { ordered: false }).catch((error) => error?.insertedDocs || []);
    }

    const touchedStudentIds = Array.from(new Set(inserted.map((doc) => String(doc.studentId))));
    if (touchedStudentIds.length) {
      await Promise.all([upsertGlobalCache(), ...touchedStudentIds.map((studentId) => upsertStudentCache(studentId))]);
    }

    await ActivityLog.log({
      userId: req.user?._id,
      userRole: req.user?.role || 'admin',
      userName: req.user?.name || 'System',
      action: 'data_imported',
      targetType: 'system',
      description: `Imported ${inserted.length} performance rows`,
      metadata: {
        attemptedRows: rows.length,
        validRows: preview.validRows.length,
        invalidRows: preview.invalidRows.length,
      },
      status: 'success',
    });

    return res.status(201).json({
      success: true,
      message: 'Performance import completed',
      data: {
        summary: {
          attemptedRows: rows.length,
          importedRows: inserted.length,
          rejectedRows: preview.invalidRows.length,
        },
        rejectReportCsv: buildRejectReportCsv(preview.invalidRows),
        invalidRows: preview.invalidRows,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  upload,
  previewPerformanceImport,
  commitPerformanceImport,
};
