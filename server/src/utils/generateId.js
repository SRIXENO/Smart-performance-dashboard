const Counter = require('../models/Counter');

const generateId = async (counterName) => {
  const counter = await Counter.findByIdAndUpdate(
    counterName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddingMap = {
    'userId': 6,
    'studentId': 6,
    'subjectId': 4
  };

  const padding = paddingMap[counterName] || 6;
  const prefix = counterName === 'userId' ? 'USR' :
                 counterName === 'studentId' ? 'STU' : 'SUB';

  return prefix + String(counter.seq).padStart(padding, '0');
};

module.exports = { generateId };