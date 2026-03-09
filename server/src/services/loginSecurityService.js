const crypto = require('crypto');
const ActivityLog = require('../models/ActivityLog');

const FAILURE_WINDOW_MINUTES = Number(process.env.LOGIN_FAILURE_WINDOW_MINUTES || 15);
const FAILURE_BLOCK_THRESHOLD = Number(process.env.LOGIN_FAILURE_BLOCK_THRESHOLD || 6);
const IP_FAILURE_BLOCK_THRESHOLD = Number(process.env.LOGIN_IP_FAILURE_BLOCK_THRESHOLD || 12);
const ANOMALY_LOOKBACK_DAYS = Number(process.env.LOGIN_ANOMALY_LOOKBACK_DAYS || 30);

const buildDeviceFingerprint = (userAgent) => crypto
  .createHash('sha256')
  .update(String(userAgent || '').trim().toLowerCase())
  .digest('hex');

const getWindowStart = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
};

const getLookbackStart = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const getRecentFailedAttempts = async ({ identifier, ipAddress, userId }) => {
  const since = getWindowStart(FAILURE_WINDOW_MINUTES);
  const filters = [{ action: 'login_failed', timestamp: { $gte: since } }];

  if (identifier) {
    filters.push({ action: 'login_failed', timestamp: { $gte: since }, 'metadata.identifier': identifier });
  }
  if (ipAddress) {
    filters.push({ action: 'login_failed', timestamp: { $gte: since }, ipAddress });
  }
  if (userId) {
    filters.push({ action: 'login_failed', timestamp: { $gte: since }, userId });
  }

  const attempts = await ActivityLog.find({ $or: filters })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  const byIdentifier = attempts.filter((item) => item.metadata?.identifier === identifier).length;
  const byIpAddress = attempts.filter((item) => item.ipAddress === ipAddress).length;
  const byUser = userId ? attempts.filter((item) => String(item.userId || '') === String(userId)).length : 0;
  const uniqueFailureIps = new Set(attempts.map((item) => item.ipAddress).filter(Boolean)).size;

  return {
    attempts,
    byIdentifier,
    byIpAddress,
    byUser,
    uniqueFailureIps,
  };
};

const isLoginBlocked = async ({ identifier, ipAddress, userId }) => {
  const failures = await getRecentFailedAttempts({ identifier, ipAddress, userId });
  return {
    blocked: failures.byIdentifier >= FAILURE_BLOCK_THRESHOLD || failures.byIpAddress >= IP_FAILURE_BLOCK_THRESHOLD,
    failures,
  };
};

const evaluateLoginAnomaly = async ({ user, identifier, ipAddress, userAgent }) => {
  const lookbackStart = getLookbackStart(ANOMALY_LOOKBACK_DAYS);
  const deviceFingerprint = buildDeviceFingerprint(userAgent);
  const recentSuccesses = await ActivityLog.find({
    action: 'login',
    userId: user._id,
    status: 'success',
    timestamp: { $gte: lookbackStart },
  })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  const recentFailures = await getRecentFailedAttempts({ identifier, ipAddress, userId: user._id });
  const knownIps = new Set(recentSuccesses.map((item) => item.ipAddress).filter(Boolean));
  const knownDevices = new Set(recentSuccesses.map((item) => item.metadata?.deviceFingerprint).filter(Boolean));
  const reasons = [];
  let riskScore = 0;

  if (recentSuccesses.length > 0 && ipAddress && !knownIps.has(ipAddress)) {
    reasons.push('New IP address for this account');
    riskScore += 35;
  }

  if (recentSuccesses.length > 0 && deviceFingerprint && !knownDevices.has(deviceFingerprint)) {
    reasons.push('New device fingerprint detected');
    riskScore += 30;
  }

  if (recentFailures.byIdentifier >= 3 || recentFailures.byUser >= 3) {
    reasons.push(`Multiple failed login attempts in last ${FAILURE_WINDOW_MINUTES} minutes`);
    riskScore += 25;
  }

  if (recentFailures.uniqueFailureIps >= 3) {
    reasons.push('Failed attempts came from multiple IP addresses');
    riskScore += 20;
  }

  const severity = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : riskScore > 0 ? 'low' : 'none';

  return {
    detected: reasons.length > 0,
    severity,
    riskScore,
    reasons,
    deviceFingerprint,
    recentFailureCount: Math.max(recentFailures.byIdentifier, recentFailures.byUser),
    uniqueFailureIps: recentFailures.uniqueFailureIps,
  };
};

const logFailedLogin = async ({ identifier, ipAddress, userAgent, user = null, reason }) => {
  await ActivityLog.log({
    userId: user?._id,
    userRole: user?.role || 'system',
    userName: user?.name || identifier || 'Unknown user',
    action: 'login_failed',
    targetType: 'system',
    description: 'Failed login attempt detected',
    metadata: {
      identifier,
      email: user?.email,
      loginMethod: 'local',
      reason,
      deviceFingerprint: buildDeviceFingerprint(userAgent),
    },
    ipAddress,
    userAgent,
    status: 'failed',
    errorMessage: reason,
  });
};

const logSuccessfulLogin = async ({
  user,
  identifier,
  ipAddress,
  userAgent,
  anomaly,
  loginMethod = 'local',
  description = 'User logged in',
}) => {
  await ActivityLog.log({
    userId: user._id,
    userRole: user.role,
    userName: user.name,
    action: 'login',
    targetType: 'system',
    description,
    metadata: {
      email: user.email,
      identifier,
      loginMethod,
      deviceFingerprint: buildDeviceFingerprint(userAgent),
      anomaly: anomaly.detected ? {
        severity: anomaly.severity,
        riskScore: anomaly.riskScore,
        reasons: anomaly.reasons,
        recentFailureCount: anomaly.recentFailureCount,
        uniqueFailureIps: anomaly.uniqueFailureIps,
      } : null,
    },
    ipAddress,
    userAgent,
    status: 'success',
  });

  if (anomaly.detected) {
    await ActivityLog.log({
      userId: user._id,
      userRole: user.role,
      userName: user.name,
      action: 'login_anomaly',
      targetType: 'system',
      description: `Suspicious login detected (${anomaly.severity})`,
      metadata: {
        email: user.email,
        identifier,
        loginMethod,
        severity: anomaly.severity,
        riskScore: anomaly.riskScore,
        reasons: anomaly.reasons,
        recentFailureCount: anomaly.recentFailureCount,
        uniqueFailureIps: anomaly.uniqueFailureIps,
        deviceFingerprint: anomaly.deviceFingerprint,
      },
      ipAddress,
      userAgent,
      status: 'pending',
    });
  }
};

module.exports = {
  isLoginBlocked,
  evaluateLoginAnomaly,
  logFailedLogin,
  logSuccessfulLogin,
};
