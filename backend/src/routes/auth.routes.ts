import { Router } from 'express';

import {
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller.js';

const router = Router();

/*
POST /api/auth/register
*/
router.post('/register', registerUser);

/*
POST /api/auth/login
*/
router.post('/login', loginUser);

/*
POST /api/auth/logout
*/
router.post('/logout', logoutUser);

export default router;
