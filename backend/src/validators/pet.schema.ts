import { z } from 'zod';

// ── Create Pet ────────────────────────────────────────────────────────────────
export const createPetSchema = z.object({
  name: z.string().max(255).optional(),
  type: z.string().min(1, 'Pet type is required').max(100),
  breed: z.string().max(255).optional(),
  color: z.string().max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
  age: z.number().int().min(0).max(100).optional(),
  wellness: z.string().max(255).optional(),
  birthmark: z.string().optional(),

  // Cloudinary result from client-side direct upload
  imageUrl: z.string().url('Invalid image URL').optional(),
  imagePublicId: z.string().optional(),

  status: z
    .enum(['LOST', 'FOUND', 'ADOPTABLE', 'ADOPTED', 'REUNITED'])
    .default('LOST'),

  // Location
  state: z.string().min(1, 'State is required').max(255),
  city: z.string().min(1, 'City is required').max(255),
  village: z.string().max(255).optional(),
  addressLine: z.string().max(500).optional(),
  pincode: z.string().max(20).optional(),
  googleMapsLink: z.string().url().optional().or(z.literal('')),

  incidentDate: z.string().datetime().optional().or(z.string().optional()),
});

// ── Update Pet (all fields optional) ─────────────────────────────────────────
export const updatePetSchema = createPetSchema.partial();

// ── Search / Filter query params ──────────────────────────────────────────────
export const searchPetSchema = z.object({
  type: z.string().optional(),
  breed: z.string().optional(),
  color: z.string().optional(),
  location: z.string().optional(), // searches state + city + village
  status: z
    .enum(['LOST', 'FOUND', 'ADOPTABLE', 'ADOPTED', 'REUNITED'])
    .optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type SearchPetInput = z.infer<typeof searchPetSchema>;
