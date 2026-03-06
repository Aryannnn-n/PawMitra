import { Router } from 'express';
import {
  changePassword,
  deleteMe,
  getMe,
  getUserById,
  updateMe,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const UserRouter = Router();

// All user routes require authentication
UserRouter.use(requireAuth);

// GET    /api/users/me              → get own profile
UserRouter.get('/me', getMe);

// PUT    /api/users/me              → update profile (name, username, email, etc.)
UserRouter.put('/me', updateMe);

// PUT    /api/users/change-password → change password
UserRouter.put('/change-password', changePassword);

// DELETE /api/users/me              → delete own account
UserRouter.delete('/me', deleteMe);

// GET    /api/users/:id             → get any user's public profile
UserRouter.get('/:id', getUserById);

export default UserRouter;
