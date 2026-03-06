import { Router } from 'express';
import {
  approveAdoption,
  getMyAdoptions,
  rejectAdoption,
  requestAdoption,
} from '../controllers/adoption.controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';

const AdoptionRouter = Router();

// All adoption routes require authentication
AdoptionRouter.use(requireAuth);

// POST /api/adoptions/:petId        → request adoption (any user)
AdoptionRouter.post('/:petId', requestAdoption);

// GET  /api/adoptions/my            → get own adoption requests
// ⚠️  Must be BEFORE /:id to avoid "my" being treated as an id
AdoptionRouter.get('/my', getMyAdoptions);

// POST /api/adoptions/:id/approve   → admin only
AdoptionRouter.post('/:id/approve', requireAdmin, approveAdoption);

// POST /api/adoptions/:id/reject    → admin only
AdoptionRouter.post('/:id/reject', requireAdmin, rejectAdoption);

export default AdoptionRouter;
