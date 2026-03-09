const mongoose = require('mongoose');
const Performance = require('../models/Performance');
const AnalyticsCache = require('../models/AnalyticsCache');

const round = (v, n = 2) => Number((Number(v) || 0).toFixed(n));

const computeGlobalMetrics = async () => {
  const [summaryAgg, subjectAgg, atRiskAgg, totalStudentsAgg] = await Promise.all([
    Performance.aggregate([
      {
        $group: {
          _id: null,
          averageMarks: { $avg: '$marks' },
          averageAttendance: { $avg: '$attendancePercentage' },
          passRateRaw: { $avg: { $cond: [{ $gte: ['$marks', 60] }, 1, 0] } },
        },
      },
    ]),
    Performance.aggregate([
      { $group: { _id: '$subjectName', avgMarks: { $avg: '$marks' }, count: { $sum: 1 } } },
      { $sort: { avgMarks: -1, count: -1 } },
      { $limit: 1 },
    ]),
    Performance.aggregate([
      { $sort: { lastUpdated: -1 } },
      {
        $group: {
          _id: '$studentId',
          latestAttendance: { $first: '$attendancePercentage' },
          latestMarks: { $first: '$marks' },
        },
      },
      { $match: { $or: [{ latestAttendance: { $lt: 75 } }, { latestMarks: { $lt: 60 } }] } },
      { $count: 'count' },
    ]),
    Performance.aggregate([{ $group: { _id: '$studentId' } }, { $count: 'count' }]),
  ]);

  const summary = summaryAgg[0] || {};
  const topSubject = subjectAgg[0] || null;

  return {
    averageMarks: round(summary.averageMarks, 2),
    averageAttendance: round(summary.averageAttendance, 2),
    passRate: round((summary.passRateRaw || 0) * 100, 2),
    atRiskStudents: atRiskAgg[0]?.count || 0,
    totalStudentsWithPerformance: totalStudentsAgg[0]?.count || 0,
    topSubject: topSubject
      ? { name: topSubject._id, averageMarks: round(topSubject.avgMarks, 2), sampleSize: topSubject.count }
      : null,
    generatedAt: new Date().toISOString(),
  };
};

const computeStudentMetrics = async (studentId) => {
  const id = new mongoose.Types.ObjectId(String(studentId));
  const [summaryAgg, subjectAgg, trendAgg] = await Promise.all([
    Performance.aggregate([
      { $match: { studentId: id } },
      {
        $group: {
          _id: '$studentId',
          averageMarks: { $avg: '$marks' },
          averageAttendance: { $avg: '$attendancePercentage' },
          passRateRaw: { $avg: { $cond: [{ $gte: ['$marks', 60] }, 1, 0] } },
          totalRecords: { $sum: 1 },
        },
      },
    ]),
    Performance.aggregate([
      { $match: { studentId: id } },
      {
        $group: {
          _id: '$subjectName',
          averageMarks: { $avg: '$marks' },
          averageAttendance: { $avg: '$attendancePercentage' },
          latestGrade: { $last: '$grade' },
          count: { $sum: 1 },
        },
      },
      { $sort: { averageMarks: -1 } },
    ]),
    Performance.aggregate([
      { $match: { studentId: id } },
      { $sort: { lastUpdated: 1 } },
      {
        $project: {
          _id: 0,
          date: { $dateToString: { format: '%Y-%m-%d', date: '$lastUpdated' } },
          marks: 1,
          attendance: '$attendancePercentage',
          semester: 1,
          subjectName: 1,
        },
      },
    ]),
  ]);

  const summary = summaryAgg[0] || {};
  const atRisk = (summary.averageAttendance || 0) < 75 || (summary.averageMarks || 0) < 60;

  return {
    studentId: String(studentId),
    averageMarks: round(summary.averageMarks, 2),
    averageAttendance: round(summary.averageAttendance, 2),
    passRate: round((summary.passRateRaw || 0) * 100, 2),
    atRisk,
    totalRecords: summary.totalRecords || 0,
    topSubject: subjectAgg[0]
      ? {
          name: subjectAgg[0]._id,
          averageMarks: round(subjectAgg[0].averageMarks, 2),
          averageAttendance: round(subjectAgg[0].averageAttendance, 2),
          sampleSize: subjectAgg[0].count,
        }
      : null,
    subjectBreakdown: subjectAgg.map((row) => ({
      subjectName: row._id,
      averageMarks: round(row.averageMarks, 2),
      averageAttendance: round(row.averageAttendance, 2),
      latestGrade: row.latestGrade || 'N/A',
      sampleSize: row.count,
    })),
    trend: trendAgg,
    generatedAt: new Date().toISOString(),
  };
};

const upsertGlobalCache = async () => {
  const metrics = await computeGlobalMetrics();
  await AnalyticsCache.findOneAndUpdate(
    { scope: 'global' },
    { scope: 'global', metrics, computedAt: new Date(), ttlSeconds: 300 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return metrics;
};

const upsertStudentCache = async (studentId) => {
  const metrics = await computeStudentMetrics(studentId);
  await AnalyticsCache.findOneAndUpdate(
    { scope: 'student', studentId },
    { scope: 'student', studentId, metrics, computedAt: new Date(), ttlSeconds: 300 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return metrics;
};

const getCacheIfFresh = async ({ scope, studentId, maxAgeSeconds = 120 }) => {
  const query = { scope };
  if (studentId) query.studentId = studentId;
  const cached = await AnalyticsCache.findOne(query).lean();
  if (!cached) return null;
  const ageSeconds = (Date.now() - new Date(cached.computedAt).getTime()) / 1000;
  if (ageSeconds > maxAgeSeconds) return null;
  return cached.metrics;
};

module.exports = {
  computeGlobalMetrics,
  computeStudentMetrics,
  upsertGlobalCache,
  upsertStudentCache,
  getCacheIfFresh,
};
