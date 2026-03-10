import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
// Summary stats — mirrors Flask admin_dashboard
export const getDashboard = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Auto-cleanup rejected adoption requests older than 15 days
    const threshold = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    await prisma.adoptionRequest.deleteMany({
      where: { status: 'REJECTED', updatedAt: { lt: threshold } },
    });

    // User counts
    const [totalUsers, totalAdmins] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    // Pet counts (approved only for status breakdown)
    const [
      totalPets,
      lostCount,
      foundCount,
      adoptableCount,
      adoptedCount,
      reunitedCount,
    ] = await Promise.all([
      prisma.pet.count({ where: { validationStatus: 'APPROVED' } }),
      prisma.pet.count({
        where: { validationStatus: 'APPROVED', status: 'LOST' },
      }),
      prisma.pet.count({
        where: { validationStatus: 'APPROVED', status: 'FOUND' },
      }),
      prisma.pet.count({
        where: { validationStatus: 'APPROVED', status: 'ADOPTABLE' },
      }),
      prisma.pet.count({
        where: { validationStatus: 'APPROVED', status: 'ADOPTED' },
      }),
      prisma.pet.count({
        where: { validationStatus: 'APPROVED', status: 'REUNITED' },
      }),
    ]);

    // Validation breakdown (all pets)
    const [pendingValidation, approvedValidation, rejectedValidation] =
      await Promise.all([
        prisma.pet.count({ where: { validationStatus: 'PENDING' } }),
        prisma.pet.count({ where: { validationStatus: 'APPROVED' } }),
        prisma.pet.count({ where: { validationStatus: 'REJECTED' } }),
      ]);

    // Adoption request counts
    const [pendingAdoptions, approvedAdoptions, rejectedAdoptions] =
      await Promise.all([
        prisma.adoptionRequest.count({ where: { status: 'PENDING' } }),
        prisma.adoptionRequest.count({ where: { status: 'APPROVED' } }),
        prisma.adoptionRequest.count({ where: { status: 'REJECTED' } }),
      ]);

    res.status(200).json({
      users: { totalUsers, totalAdmins },
      pets: {
        totalPets,
        lostCount,
        foundCount,
        adoptableCount,
        adoptedCount,
        reunitedCount,
      },
      validation: { pendingValidation, approvedValidation, rejectedValidation },
      adoptions: { pendingAdoptions, approvedAdoptions, rejectedAdoptions },
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/admin/pets ───────────────────────────────────────────────────────
// All pets with validation status (for admin review table)
export const getAllPets = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const pets = await prisma.pet.findMany({
      orderBy: { dateReported: 'desc' },
      include: {
        owner: { select: { id: true, username: true, email: true } },
      },
    });
    res.status(200).json({ pets, total: pets.length });
  } catch (error) {
    console.error('getAllPets error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PATCH /api/admin/pets/:id/validation ─────────────────────────────────────
// Approve or reject a pet report
export const changePetValidation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const petId = parseInt(req.params.id as string, 10);
    if (isNaN(petId)) {
      res.status(400).json({ msg: 'Invalid pet ID' });
      return;
    }

    const { validationStatus } = req.body as {
      validationStatus: 'APPROVED' | 'REJECTED';
    };

    if (!['APPROVED', 'REJECTED'].includes(validationStatus)) {
      res
        .status(400)
        .json({ msg: 'validationStatus must be APPROVED or REJECTED' });
      return;
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      res.status(404).json({ msg: 'Pet not found' });
      return;
    }

    if (validationStatus === 'REJECTED') {
      // Delete pet entirely on rejection (mirrors Flask behaviour)
      await prisma.pet.delete({ where: { id: petId } });

      // Notify owner
      await prisma.notification.create({
        data: {
          userId: pet.ownerId,
          message: `❌ Your pet report for "${pet.name || pet.type}" has been rejected and removed.`,
        },
      });

      res.status(200).json({ msg: 'Pet report rejected and deleted.' });
      return;
    }

    // Approve
    await prisma.pet.update({
      where: { id: petId },
      data: { validationStatus: 'APPROVED' },
    });

    // Notify owner on approval
    await prisma.notification.create({
      data: {
        userId: pet.ownerId,
        message: `✅ Your pet report for "${pet.name || pet.type}" has been approved.`,
      },
    });

    res.status(200).json({ msg: 'Pet report approved ✅' });
  } catch (error) {
    console.error('changePetValidation error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PATCH /api/admin/pets/:id/status ─────────────────────────────────────────
// Manually change a pet's lifecycle status
export const changePetStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const petId = parseInt(req.params.id as string, 10);
    if (isNaN(petId)) {
      res.status(400).json({ msg: 'Invalid pet ID' });
      return;
    }

    const { status } = req.body as { status: string };
    const validStatuses = ['LOST', 'FOUND', 'ADOPTABLE', 'ADOPTED', 'REUNITED'];

    if (!validStatuses.includes(status)) {
      res
        .status(400)
        .json({ msg: `status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      res.status(404).json({ msg: 'Pet not found' });
      return;
    }

    await prisma.pet.update({
      where: { id: petId },
      data: { status: status as any },
    });

    res.status(200).json({ msg: `Pet status updated to ${status}` });
  } catch (error) {
    console.error('changePetStatus error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        location: true,
        createdAt: true,
        role: true,
      },
    });
    res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ msg: 'Invalid user ID' });
      return;
    }

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      res
        .status(400)
        .json({ msg: 'You cannot delete your own account from admin panel.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ msg: 'User not found' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });

    res
      .status(200)
      .json({ msg: `User "${user.username}" deleted successfully.` });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/admin/adoptions ──────────────────────────────────────────────────
export const getAllAdoptions = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const requests = await prisma.adoptionRequest.findMany({
      orderBy: { requestDate: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true } },
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
    res.status(200).json({ requests, total: requests.length });
  } catch (error) {
    console.error('getAllAdoptions error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/admin/rooms ─────────────────────────────────────────────────────
// Admin manually creates a chat room with selected participants
export const createRoom = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, petId, participantIds } = req.body as {
      name: string;
      petId?: number;
      participantIds: number[]; // user IDs selected by admin (excluding admins — added automatically)
    };

    if (!name?.trim()) {
      res.status(400).json({ msg: 'Room name is required' });
      return;
    }

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      res.status(400).json({ msg: 'At least one participant is required' });
      return;
    }

    // Fetch all admins — always included
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    // Merge: selected users + all admins, deduplicated
    const allParticipantIds = [
      ...new Set([...participantIds, ...admins.map((a) => a.id)]),
    ];

    // Validate petId if provided
    if (petId) {
      const pet = await prisma.pet.findUnique({ where: { id: petId } });
      if (!pet) {
        res.status(404).json({ msg: 'Pet not found' });
        return;
      }
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: name.trim(),
        ...(petId ? { petId } : {}),
        participants: {
          create: allParticipantIds.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true } } },
        },
        pet: { select: { id: true, name: true, type: true } },
      },
    });

    // Notify all participants
    await prisma.notification.createMany({
      data: allParticipantIds.map((uid) => ({
        userId: uid,
        message: `💬 You've been added to chat room "${room.name}".`,
      })),
    });

    res.status(201).json({ msg: 'Chat room created ✅', room });
  } catch (error) {
    console.error('createRoom error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/admin/rooms ──────────────────────────────────────────────────────
export const getAllRooms = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rooms = await prisma.chatRoom.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pet: { select: { id: true, name: true, type: true } },
        participants: {
          include: { user: { select: { id: true, username: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    res.status(200).json({ rooms, total: rooms.length });
  } catch (error) {
    console.error('getAllRooms error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PATCH /api/admin/rooms/:id/toggle ────────────────────────────────────────
// Enable / disable a chat room
export const toggleRoom = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roomId = parseInt(req.params.id as string, 10);
    if (isNaN(roomId)) {
      res.status(400).json({ msg: 'Invalid room ID' });
      return;
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      res.status(404).json({ msg: 'Room not found' });
      return;
    }

    const updated = await prisma.chatRoom.update({
      where: { id: roomId },
      data: { isDisabled: !room.isDisabled },
    });

    const status = updated.isDisabled ? 'disabled' : 'enabled';

    // Notify all participants
    const participants = await prisma.roomParticipant.findMany({
      where: { roomId },
    });
    await prisma.notification.createMany({
      data: participants.map((p) => ({
        userId: p.userId,
        message: `ℹ️ Chat room "${room.name}" has been ${status} by admin.`,
      })),
    });

    res
      .status(200)
      .json({ msg: `Room "${room.name}" ${status} successfully.` });
  } catch (error) {
    console.error('toggleRoom error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── DELETE /api/admin/rooms/:id ───────────────────────────────────────────────
export const deleteRoom = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roomId = parseInt(req.params.id as string, 10);
    if (isNaN(roomId)) {
      res.status(400).json({ msg: 'Invalid room ID' });
      return;
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (!room) {
      res.status(404).json({ msg: 'Room not found' });
      return;
    }

    // Notify all participants before deletion
    await prisma.notification.createMany({
      data: room.participants
        .filter((p) => p.userId !== req.user!.id)
        .map((p) => ({
          userId: p.userId,
          message: `🗑️ Chat room "${room.name}" has been deleted by admin.`,
        })),
    });

    await prisma.chatRoom.delete({ where: { id: roomId } });

    res.status(200).json({ msg: `Room "${room.name}" deleted successfully.` });
  } catch (error) {
    console.error('deleteRoom error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
