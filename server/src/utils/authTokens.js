const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRE = process.env.JWT_EXPIRE || '15m';
const REFRESH_TOKEN_EXPIRE_DAYS = Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 14);
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000;

const hashToken = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
});

const generateAccessToken = (user) => jwt.sign(
  { userId: user._id, role: user.role, type: 'access' },
  process.env.JWT_SECRET,
  { expiresIn: ACCESS_TOKEN_EXPIRE }
);

const generateRefreshTokenValue = (user) => jwt.sign(
  {
    userId: user._id,
    role: user.role,
    type: 'refresh',
    tokenId: crypto.randomUUID(),
  },
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d` }
);

const sanitizeRefreshTokens = (user) => {
  const now = Date.now();
  user.refreshTokens = (user.refreshTokens || []).filter((token) =>
    !token.revokedAt && new Date(token.expiresAt).getTime() > now
  ).slice(-5);
};

const issueSessionTokens = async (user, req, res, previousTokenId = null) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshTokenValue(user);
  const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  sanitizeRefreshTokens(user);

  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    tokenId: decodedRefresh.tokenId,
    expiresAt: new Date(decodedRefresh.exp * 1000),
    createdAt: new Date(),
    lastUsedAt: new Date(),
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  });

  if (previousTokenId) {
    user.refreshTokens = user.refreshTokens.map((session) => {
      if (session.tokenId === previousTokenId) {
        session.revokedAt = new Date();
        session.replacedByTokenId = decodedRefresh.tokenId;
      }
      return session;
    });
  }

  await user.save();
  res.cookie('token', accessToken, getCookieOptions(ACCESS_COOKIE_MAX_AGE_MS));
  res.cookie('refresh_token', refreshToken, getCookieOptions(REFRESH_COOKIE_MAX_AGE_MS));

  return {
    accessToken,
    refreshToken,
  };
};

module.exports = {
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE_DAYS,
  ACCESS_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_MAX_AGE_MS,
  hashToken,
  getCookieOptions,
  generateAccessToken,
  generateRefreshTokenValue,
  sanitizeRefreshTokens,
  issueSessionTokens,
};
