import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// ── GET /api/chat/dm/:userId ──────────────────────────────────────────────────
// Full DM history between current user and another user
export const getDmHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const otherUserId = parseInt(req.params.userId as string, 10);
    if (isNaN(otherUserId)) {
      res.status(400).json({ msg: 'Invalid user ID' });
      return;
    }

    const myId = req.user!.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
      },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });

    // Mark all unread messages from otherUser as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: myId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({ messages, total: messages.length });
  } catch (error) {
    console.error('getDmHistory error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/chat/rooms ───────────────────────────────────────────────────────
// All chat rooms the current user is a participant of
export const getMyRooms = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const myId = req.user!.id;

    const participations = await prisma.roomParticipant.findMany({
      where: { userId: myId },
      include: {
        room: {
          include: {
            pet: {
              select: { id: true, name: true, type: true, imageUrl: true },
            },
            participants: {
              include: {
                user: { select: { id: true, username: true } },
              },
            },
            // Latest message preview
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, username: true } },
              },
            },
          },
        },
      },
    });

    const rooms = participations.map((p) => p.room);

    res.status(200).json({ rooms, total: rooms.length });
  } catch (error) {
    console.error('getMyRooms error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/chat/rooms/:roomId ───────────────────────────────────────────────
// Full message history for a specific room
export const getRoomHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roomId = parseInt(req.params.roomId as string, 10);
    if (isNaN(roomId)) {
      res.status(400).json({ msg: 'Invalid room ID' });
      return;
    }

    const myId = req.user!.id;

    // Check user is a participant
    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: myId } },
    });

    if (!participant) {
      res
        .status(403)
        .json({ msg: 'Forbidden: You are not a participant of this room' });
      return;
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        pet: { select: { id: true, name: true, type: true, imageUrl: true } },
        participants: {
          include: { user: { select: { id: true, username: true } } },
        },
        messages: {
          orderBy: { timestamp: 'asc' },
          include: {
            sender: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({ msg: 'Room not found' });
      return;
    }

    res.status(200).json({ room });
  } catch (error) {
    console.error('getRoomHistory error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
