import { z } from 'zod';

// Request Adoption
// No body needed — petId comes from URL param, userId from JWT
// Keeping schema for any future fields (e.g. message to owner)
export const requestAdoptionSchema = z.object({
  message: z.string().max(500).optional(), // optional note from adopter
});

// Admin Action
export const adoptionActionSchema = z.object({
  reason: z.string().max(500).optional(), // optional reason for rejection
});

export type RequestAdoptionInput = z.infer<typeof requestAdoptionSchema>;
export type AdoptionActionInput = z.infer<typeof adoptionActionSchema>;
