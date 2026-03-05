import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  sendVerification,
  verifyCode,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const AuthRouter = Router();

// POST /api/auth/send-verification  → send OTP email
AuthRouter.post('/send-verification', sendVerification);

// POST /api/auth/verify             → verify OTP
AuthRouter.post('/verify', verifyCode);

// POST /api/auth/register           → register after OTP verified
AuthRouter.post('/register', registerUser);

// POST /api/auth/login              → login, returns JWT
AuthRouter.post('/login', loginUser);

// POST /api/auth/logout             → stateless logout (client drops token)
AuthRouter.post('/logout', requireAuth, logoutUser);

export default AuthRouter;
