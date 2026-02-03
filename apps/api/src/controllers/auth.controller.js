const { success } = require('../utils/response');
const { services } = require('../composition/root');
const authService = services.authService;

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
    const result = await authService.login(email, password);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    success(res, result, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    success(res, { success: true }, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
