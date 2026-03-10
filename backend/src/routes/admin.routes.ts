import { Router } from 'express';
import {
  changePetStatus,
  changePetValidation,
  createRoom,
  deleteRoom,
  deleteUser,
  getAllAdoptions,
  getAllPets,
  getAllRooms,
  getAllUsers,
  getDashboard,
  toggleRoom,
} from '../controllers/admin.controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';

const AdminRouter = Router();

// All admin routes require auth + admin role
AdminRouter.use(requireAuth, requireAdmin);

// ── Dashboard ─────────────────────────────────────────────────────────────────
// GET  /api/admin/dashboard             → summary stats
AdminRouter.get('/dashboard', getDashboard);

// ── Pets ──────────────────────────────────────────────────────────────────────
// GET    /api/admin/pets                → all pets (for review table)
AdminRouter.get('/pets', getAllPets);

// PATCH  /api/admin/pets/:id/validation → approve or reject pet report
AdminRouter.patch('/pets/:id/validation', changePetValidation);

// PATCH  /api/admin/pets/:id/status     → change pet lifecycle status
AdminRouter.patch('/pets/:id/status', changePetStatus);

// ── Users ─────────────────────────────────────────────────────────────────────
// GET    /api/admin/users               → all non-admin users
AdminRouter.get('/users', getAllUsers);

// DELETE /api/admin/users/:id           → delete a user
AdminRouter.delete('/users/:id', deleteUser);

// ── Adoptions ─────────────────────────────────────────────────────────────────
// GET    /api/admin/adoptions           → all adoption requests
AdminRouter.get('/adoptions', getAllAdoptions);

// ── Chat Rooms ────────────────────────────────────────────────────────────────
// POST    /api/admin/rooms               → create chat room
AdminRouter.post('/rooms', createRoom);

// GET    /api/admin/rooms               → all chat rooms
AdminRouter.get('/rooms', getAllRooms);

// PATCH  /api/admin/rooms/:id/toggle    → enable / disable room
AdminRouter.patch('/rooms/:id/toggle', toggleRoom);

// DELETE /api/admin/rooms/:id           → delete room
AdminRouter.delete('/rooms/:id', deleteRoom);

export default AdminRouter;
