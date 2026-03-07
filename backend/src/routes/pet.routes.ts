import { Router } from 'express';
import {
  createPet,
  deletePet,
  getPetById,
  getPets,
  getUploadSignature,
  searchPets,
  updatePet,
} from '../controllers/pet.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const PetRouter = Router();

// ── Public routes (no auth needed) ───────────────────────────────────────────

// GET  /api/pets                → home feed, latest 25 approved pets
PetRouter.get('/', getPets);

// GET  /api/pets/search         → filter by type, breed, color, location, status
// ⚠️  Must be BEFORE /:id to avoid "search" being treated as an id
PetRouter.get('/search', searchPets);

// ── Protected routes (require JWT) ───────────────────────────────────────────

// GET  /api/pets/upload-signature → returns signed Cloudinary params for direct upload
// ⚠️  Must be BEFORE /:id
PetRouter.get('/upload-signature', requireAuth, getUploadSignature);

// POST /api/pets                → report a new pet (imageUrl + imagePublicId from Cloudinary)
PetRouter.post('/', requireAuth, createPet);

// GET  /api/pets/:id            → pet detail page
PetRouter.get('/:id', getPetById);

// PUT  /api/pets/:id            → edit pet (owner only)
PetRouter.put('/:id', requireAuth, updatePet);

// DELETE /api/pets/:id          → delete pet (owner or admin)
PetRouter.delete('/:id', requireAuth, deletePet);

export default PetRouter;
