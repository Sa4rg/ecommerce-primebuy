const { success } = require('../utils/response');
const { services } = require('../composition/root');
const authService = services.authService;
const emailVerificationService = services.emailVerificationService;

const { OAuth2Client } = require('google-auth-library');
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  APP_PUBLIC_URL,
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
} = require('../config/env');
const { generateState } = require('../utils/oauthState');
const { AppError } = require('../utils/errors');

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

const cookieBaseOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
};

const cookieOptions = {
  ...cookieBaseOptions,
  maxAge: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
};

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const user = await authService.register(email, password, name);
    
    // Send verification code after registration
    await emailVerificationService.sendVerificationCode(user.userId, user.email);
    
    res.status(201);
    success(res, user, 'User registered. Please verify your email.');
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    
    // Verify code and get verified user
    const user = await emailVerificationService.verifyEmail(email, code);
    
    // Issue tokens (auto-login after verification)
    const { accessToken, refreshToken } = await authService.issueTokensForUser(user);
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    success(res, { 
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
      }
    }, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    await emailVerificationService.resendVerificationCode(email);
    success(res, { sent: true }, 'Verification code sent');
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
    const refreshToken = req.cookies?.refreshToken || getCookieValue(req.headers.cookie, 'refreshToken');
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);
    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    success(res, { accessToken }, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || getCookieValue(req.headers.cookie, 'refreshToken');
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken', cookieBaseOptions);
    success(res, { success: true }, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    const { userId } = req.user;
    await authService.logoutAll(userId);
    res.clearCookie('refreshToken', cookieBaseOptions);
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


async function googleStart(req, res, next) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new AppError('Google OAuth is not configured', 500);
    }

    const returnTo = req.query.returnTo || '/account';

    const state = generateState();

    // CSRF cookie
    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/oauth/google',
      maxAge: 10 * 60 * 1000, // 10 min
    });

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state: `${state}:${encodeURIComponent(returnTo)}`,
      prompt: 'select_account',
      access_type: 'offline',
      include_granted_scopes: 'true',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(url);
  } catch (err) {
    next(err);
  }
}

async function googleCallback(req, res, next) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new AppError('Google OAuth is not configured', 500);
    }

    const { code, state } = req.query;

    if (!code || !state) {
      throw new AppError('Invalid OAuth callback', 400);
    }

    const cookieState = req.cookies?.google_oauth_state;
    if (!cookieState) {
      throw new AppError('OAuth state missing', 400);
    }

    // state format: "<state>:<returnTo>"
    const [stateValue, returnToEncoded] = String(state).split(':');

    if (!stateValue || stateValue !== cookieState) {
      throw new AppError('Invalid OAuth state', 400);
    }

    const returnTo = returnToEncoded ? decodeURIComponent(returnToEncoded) : '/account';

    // Clear cookie
    res.cookie('google_oauth_state', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/oauth/google',
      maxAge: 0,
    });

    // Exchange code -> tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenBody = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok) {
      throw new AppError(tokenBody?.error_description || 'Google token exchange failed', 401);
    }

    const idToken = tokenBody?.id_token;
    if (!idToken) {
      throw new AppError('Missing id_token from Google', 401);
    }

    // Verify id_token
    const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new AppError('Invalid Google token', 401);

    const googleSub = payload.sub;
    const email = payload.email;
    const name = payload.name || payload.given_name || '';

    // Create/link user + issue tokens
    const { accessToken, refreshToken } = await authService.loginWithGoogle({
      googleSub,
      email,
      name,
    });

    // Set refresh cookie (same as login)
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Redirect to frontend callback (frontend will call /refresh)
    const redirectUrl = `${APP_PUBLIC_URL}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    // redirect with error to frontend (optional)
    try {
      const redirectUrl = `${APP_PUBLIC_URL}/auth/callback?error=${encodeURIComponent(err.message || 'Google login failed')}`;
      return res.redirect(redirectUrl);
    } catch {
      next(err);
    }
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
  googleStart,
  googleCallback,
  verifyEmail,
  resendVerification,
};
