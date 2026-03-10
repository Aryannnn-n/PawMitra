import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// ── POST /api/adoptions/:petId ────────────────────────────────────────────────
// Any logged-in user can request adoption for an ADOPTABLE pet
export const requestAdoption = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const petId = parseInt(req.params.petId as string, 10);
    if (isNaN(petId)) {
      res.status(400).json({ msg: 'Invalid pet ID' });
      return;
    }

    const userId = req.user!.id;

    // Check pet exists and is adoptable
    const pet = await prisma.pet.findUnique({ where: { id: petId } });

    if (!pet) {
      res.status(404).json({ msg: 'Pet not found' });
      return;
    }

    if (pet.status !== 'ADOPTABLE') {
      res.status(400).json({
        msg: `This pet is not available for adoption. Current status: ${pet.status}`,
      });
      return;
    }

    // Owner cannot adopt their own pet
    if (pet.ownerId === userId) {
      res
        .status(400)
        .json({ msg: 'You cannot request adoption for your own pet.' });
      return;
    }

    // Prevent duplicate requests — DB unique constraint also guards this
    const existing = await prisma.adoptionRequest.findUnique({
      where: { userId_petId: { userId, petId } },
    });

    if (existing) {
      res.status(409).json({
        msg: 'You have already submitted an adoption request for this pet.',
        status: existing.status,
      });
      return;
    }

    const adoptionRequest = await prisma.adoptionRequest.create({
      data: { userId, petId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            imageUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      msg: 'Adoption request submitted successfully ✅',
      adoptionRequest,
    });
  } catch (error) {
    console.error('requestAdoption error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/adoptions/my ─────────────────────────────────────────────────────
// Logged-in user sees all their own adoption requests
export const getMyAdoptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.adoptionRequest.findMany({
      where: { userId },
      orderBy: { requestDate: 'desc' },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            type: true,
            breed: true,
            status: true,
            imageUrl: true,
            city: true,
            state: true,
          },
        },
      },
    });

    res.status(200).json({ requests, total: requests.length });
  } catch (error) {
    console.error('getMyAdoptions error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/adoptions/:id/approve ──────────────────────────────────────────
// Admin only — approves request, marks pet as ADOPTED, chat room creation
export const approveAdoption = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const reqId = parseInt(req.params.id as string, 10);
    if (isNaN(reqId)) {
      res.status(400).json({ msg: 'Invalid request ID' });
      return;
    }

    const adoptionReq = await prisma.adoptionRequest.findUnique({
      where: { id: reqId },
      include: { pet: true },
    });

    if (!adoptionReq) {
      res.status(404).json({ msg: 'Adoption request not found' });
      return;
    }

    if (adoptionReq.status !== 'PENDING') {
      res.status(400).json({
        msg: `Request is already ${adoptionReq.status.toLowerCase()}`,
      });
      return;
    }

    const pet = adoptionReq.pet;
    const adopterId = adoptionReq.userId;
    const ownerId = pet.ownerId;

    // Fetch all admins to add to room
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Approve the request
      await tx.adoptionRequest.update({
        where: { id: reqId },
        data: { status: 'APPROVED' },
      });

      // 2. Mark pet as ADOPTED
      await tx.pet.update({
        where: { id: pet.id },
        data: { status: 'ADOPTED', adoptedById: adopterId },
      });

      // 3. Reject all other PENDING requests for same pet
      await tx.adoptionRequest.updateMany({
        where: { petId: pet.id, status: 'PENDING', NOT: { id: reqId } },
        data: { status: 'REJECTED' },
      });

      // 4. Notify adopter
      await tx.notification.create({
        data: {
          userId: adopterId,
          message: `🎉 Your adoption request for ${pet.name || pet.type} has been approved.`,
        },
      });

      // 5. Notify owner
      await tx.notification.create({
        data: {
          userId: ownerId,
          message: `✅ Your pet "${pet.name || pet.type}" has been successfully adopted.`,
        },
      });

      // 6. Auto-create chat room ─────────────────────────────────────────────
      // Participants: adopter + owner (if different) + all admins
      const participantIds = [
        ...new Set([
          adopterId,
          ownerId,
          ...admins.map((a) => a.id),
        ]),
      ];

      const room = await tx.chatRoom.create({
        data: {
          name: `Adoption: ${pet.name || pet.type} #${pet.id}`,
          petId: pet.id,
          participants: {
            create: participantIds.map((uid) => ({ userId: uid })),
          },
        },
      });

      // 7. Notify all room participants about the new room
      await tx.notification.createMany({
        data: participantIds.map((uid) => ({
          userId: uid,
          message: `💬 A chat room has been created for the adoption of "${pet.name || pet.type}". Join to coordinate!`,
        })),
      });
    });

    res.status(200).json({
      msg: 'Adoption approved ✅ Chat room created and notifications sent.',
    });
  } catch (error) {
    console.error('approveAdoption error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/adoptions/:id/reject ────────────────────────────────────────────
// Admin only — rejects request, notifies both parties
export const rejectAdoption = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const reqId = parseInt(req.params.id as string, 10);
    if (isNaN(reqId)) {
      res.status(400).json({ msg: 'Invalid request ID' });
      return;
    }

    const adoptionReq = await prisma.adoptionRequest.findUnique({
      where: { id: reqId },
      include: { pet: true },
    });

    if (!adoptionReq) {
      res.status(404).json({ msg: 'Adoption request not found' });
      return;
    }

    if (adoptionReq.status !== 'PENDING') {
      res.status(400).json({
        msg: `Request is already ${adoptionReq.status.toLowerCase()}`,
      });
      return;
    }

    const pet = adoptionReq.pet;
    const adopterId = adoptionReq.userId;
    const ownerId = pet.ownerId;

    await prisma.$transaction(async (tx) => {
      // 1. Reject the request
      await tx.adoptionRequest.update({
        where: { id: reqId },
        data: { status: 'REJECTED' },
      });

      // 2. Notify adopter
      await tx.notification.create({
        data: {
          userId: adopterId,
          message: `❌ Sorry, your adoption request for ${pet.name || pet.type} has been rejected.`,
        },
      });

      // 3. Notify owner
      await tx.notification.create({
        data: {
          userId: ownerId,
          message: `ℹ️ The adoption request for your pet "${pet.name || pet.type}" has been rejected.`,
        },
      });
    });

    res.status(200).json({
      msg: 'Adoption rejected ❌ Notifications sent to adopter and owner.',
    });
  } catch (error) {
    console.error('rejectAdoption error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
