const { success } = require('../utils/response');
const { services } = require('../composition/root');
const authService = services.authService;

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
};

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    res.status(201);
    success(res, user, 'User registered successfully');
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await authService.login(email, password);
    res.cookie('refreshToken', refreshToken, cookieOptions);
    success(res, { accessToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const refreshToken = getCookieValue(cookieHeader, 'refreshToken');
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);
    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    success(res, { accessToken }, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const refreshToken = getCookieValue(cookieHeader, 'refreshToken');
    await authService.logout(refreshToken);
    res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    success(res, { success: true }, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    const { userId } = req.user;
    await authService.logoutAll(userId);
    res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    success(res, { success: true }, 'Logged out from all sessions');
  } catch (err) {
    next(err);
  }
}

async function passwordResetRequest(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    success(res, result, 'If the email exists, a code was sent');
  } catch (err) {
    next(err);
  }
}

async function passwordResetConfirm(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPasswordWithCode(email, code, newPassword);
    success(res, result, 'Password reset successful');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  passwordResetRequest,
  passwordResetConfirm,
};
