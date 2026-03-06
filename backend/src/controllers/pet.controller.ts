import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  deleteFromCloudinary,
  generateUploadSignature,
} from '../services/cloudinary.service.js';
import {
  createPetSchema,
  searchPetSchema,
  updatePetSchema,
} from '../validators/pet.schema.js';

// ── Helper: days since a date ─────────────────────────────────────────────────
const daysSince = (date: Date): number => {
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

// ── Safe pet select (no heavy fields in lists) ────────────────────────────────
const petListSelect = {
  id: true,
  name: true,
  type: true,
  breed: true,
  color: true,
  gender: true,
  status: true,
  validationStatus: true,
  state: true,
  city: true,
  village: true,
  imageUrl: true,
  dateReported: true,
  incidentDate: true,
  owner: {
    select: { id: true, username: true },
  },
} as const;

// ── GET /api/pets  ────────────────────────────────────────────────────────────
// Home feed — latest 25 approved pets, auto-marks adoptable
export const getPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pets = await prisma.pet.findMany({
      where: { validationStatus: 'APPROVED' },
      orderBy: { dateReported: 'desc' },
      take: 25,
      select: petListSelect,
    });

    // Auto-mark FOUND pets as ADOPTABLE after 15 days (mirrors Flask logic)
    const toUpdate = pets
      .filter((p) => p.status === 'FOUND' && daysSince(p.dateReported) >= 15)
      .map((p) => p.id);

    if (toUpdate.length > 0) {
      await prisma.pet.updateMany({
        where: { id: { in: toUpdate } },
        data: { status: 'ADOPTABLE' },
      });
    }

    res.status(200).json({ pets, total: pets.length });
  } catch (error) {
    console.error('getPets error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/pets/upload-signature  ──────────────────────────────────────────
// Returns signed params so frontend can upload directly to Cloudinary
// Must be defined BEFORE /:id route to avoid being caught by it
export const getUploadSignature = (req: Request, res: Response): void => {
  const signature = generateUploadSignature('pawmitra/pets');
  res.status(200).json(signature);
};

// ── GET /api/pets/search  ─────────────────────────────────────────────────────
export const searchPets = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filters = searchPetSchema.parse(req.query);

    const pets = await prisma.pet.findMany({
      where: {
        validationStatus: 'APPROVED',
        ...(filters.status && { status: filters.status }),
        ...(filters.type && {
          type: { contains: filters.type, mode: 'insensitive' },
        }),
        ...(filters.breed && {
          breed: { contains: filters.breed, mode: 'insensitive' },
        }),
        ...(filters.color && {
          color: { contains: filters.color, mode: 'insensitive' },
        }),
        ...(filters.location && {
          OR: [
            { state: { contains: filters.location, mode: 'insensitive' } },
            { city: { contains: filters.location, mode: 'insensitive' } },
            { village: { contains: filters.location, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { dateReported: 'desc' },
      select: petListSelect,
    });

    // Group by status — mirrors Flask grouped response
    const grouped = {
      LOST: [] as typeof pets,
      FOUND: [] as typeof pets,
      ADOPTABLE: [] as typeof pets,
      ADOPTED: [] as typeof pets,
      REUNITED: [] as typeof pets,
    };
    for (const pet of pets) {
      grouped[pet.status].push(pet);
    }

    res.status(200).json({ filters, grouped, total: pets.length });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ msg: 'Invalid filters', errors: error.flatten() });
      return;
    }
    console.error('searchPets error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/pets/:id  ────────────────────────────────────────────────────────
export const getPetById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const petId = parseInt(req.params.id as string, 10);
    if (isNaN(petId)) {
      res.status(400).json({ msg: 'Invalid pet ID' });
      return;
    }

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: {
          select: { id: true, username: true, phone: true, location: true },
        },
      },
    });

    if (!pet) {
      res.status(404).json({ msg: 'Pet not found' });
      return;
    }

    // Auto-mark adoptable if found 15+ days ago
    if (pet.status === 'FOUND' && daysSince(pet.dateReported) >= 15) {
      await prisma.pet.update({
        where: { id: petId },
        data: { status: 'ADOPTABLE' },
      });
      pet.status = 'ADOPTABLE';
    }

    res.status(200).json({ pet });
  } catch (error) {
    console.error('getPetById error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/pets  ───────────────────────────────────────────────────────────
// Frontend sends imageUrl + imagePublicId from direct Cloudinary upload
export const createPet = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createPetSchema.parse(req.body);

    const pet = await prisma.pet.create({
      data: {
        name: data.name ?? null,
        type: data.type,
        breed: data.breed ?? null,
        color: data.color ?? null,
        gender: data.gender,
        age: data.age ?? null,
        wellness: data.wellness ?? null,
        birthmark: data.birthmark ?? null,
        imageUrl: data.imageUrl ?? null,
        imagePublicId: data.imagePublicId ?? null,
        status: data.status,
        state: data.state,
        city: data.city,
        village: data.village ?? null,
        addressLine: data.addressLine ?? null,
        pincode: data.pincode ?? null,
        googleMapsLink: data.googleMapsLink || null,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
        ownerId: req.user!.id,
      },
      select: petListSelect,
    });

    res.status(201).json({ msg: 'Pet reported successfully ✅', pet });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('createPet error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PUT /api/pets/:id  ────────────────────────────────────────────────────────
export const updatePet = async (req: Request, res: Response): Promise<void> => {
  try {
    const petId = parseInt(req.params.id as string, 10);
    if (isNaN(petId)) {
      res.status(400).json({ msg: 'Invalid pet ID' });
      return;
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      res.status(404).json({ msg: 'Pet not found' });
      return;
    }

    // Only owner can edit
    if (pet.ownerId !== req.user!.id) {
      res
        .status(403)
        .json({ msg: 'Forbidden: You are not the owner of this pet' });
      return;
    }

    const data = updatePetSchema.parse(req.body);

    // If new image uploaded, delete old one from Cloudinary
    if (
      data.imagePublicId &&
      pet.imagePublicId &&
      data.imagePublicId !== pet.imagePublicId
    ) {
      await deleteFromCloudinary(pet.imagePublicId);
    }

    const updated = await prisma.pet.update({
      where: { id: petId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.breed !== undefined && { breed: data.breed }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.age !== undefined && { age: data.age }),
        ...(data.wellness !== undefined && { wellness: data.wellness }),
        ...(data.birthmark !== undefined && { birthmark: data.birthmark }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.imagePublicId !== undefined && {
          imagePublicId: data.imagePublicId,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.village !== undefined && { village: data.village }),
        ...(data.addressLine !== undefined && {
          addressLine: data.addressLine,
        }),
        ...(data.pincode !== undefined && { pincode: data.pincode }),
        ...(data.googleMapsLink !== undefined && {
          googleMapsLink: data.googleMapsLink || null,
        }),
        ...(data.incidentDate !== undefined && {
          incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
        }),
      },
      select: petListSelect,
    });

    res.status(200).json({ msg: 'Pet updated successfully ✅', pet: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('updatePet error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── DELETE /api/pets/:id  ─────────────────────────────────────────────────────
export const deletePet = async (req: Request, res: Response): Promise<void> => {
  try {
    const petId = parseInt(req.params.id as string, 10);
    if (isNaN(petId)) {
      res.status(400).json({ msg: 'Invalid pet ID' });
      return;
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      res.status(404).json({ msg: 'Pet not found' });
      return;
    }

    // Owner OR admin can delete
    if (pet.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res
        .status(403)
        .json({ msg: 'Forbidden: Not authorized to delete this pet' });
      return;
    }

    // Delete image from Cloudinary first (don't waste free quota)
    if (pet.imagePublicId) {
      await deleteFromCloudinary(pet.imagePublicId);
    }

    await prisma.pet.delete({ where: { id: petId } });

    res.status(200).json({ msg: 'Pet deleted successfully ✅' });
  } catch (error) {
    console.error('deletePet error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
