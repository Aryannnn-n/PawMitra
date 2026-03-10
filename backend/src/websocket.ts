import { IncomingMessage, Server } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import { prisma } from './lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET as string;

// ── Typed client map: userId → WebSocket ─────────────────────────────────────
const clients = new Map<number, WebSocket>();

interface AuthPayload {
  id: number;
  role: 'USER' | 'ADMIN';
}

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

// ── Send JSON safely to a socket ─────────────────────────────────────────────
const send = (ws: WebSocket, data: object) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

// ── Send to a specific user by userId ────────────────────────────────────────
const sendToUser = (userId: number, data: object) => {
  const socket = clients.get(userId);
  if (socket) send(socket, data);
};

// ── Initialize WebSocket Server ───────────────────────────────────────────────
export const initWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    let authedUser: AuthPayload | null = null;

    // ── Handle incoming messages ────────────────────────────────────────────
    ws.on('message', async (raw) => {
      let parsed: WSMessage;

      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'error', msg: 'Invalid JSON' });
        return;
      }

      const { type } = parsed;

      // ── authenticate ──────────────────────────────────────────────────────
      if (type === 'authenticate') {
        const token = parsed.token as string;
        if (!token) {
          send(ws, { type: 'error', msg: 'Token required' });
          return;
        }

        try {
          const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
          authedUser = decoded;
          clients.set(decoded.id, ws);

          send(ws, { type: 'authenticated', userId: decoded.id });
          console.log(`WS: User ${decoded.id} authenticated`);
        } catch {
          send(ws, { type: 'error', msg: 'Invalid or expired token' });
        }

        return;
      }

      // ── Require authentication for all other events ───────────────────────
      if (!authedUser) {
        send(ws, { type: 'error', msg: 'Please authenticate first' });
        return;
      }

      // ── dm:send ───────────────────────────────────────────────────────────
      if (type === 'dm:send') {
        const receiverId = parsed.receiverId as number;
        const content = (parsed.content as string)?.trim();

        if (!receiverId || !content) {
          send(ws, {
            type: 'error',
            msg: 'receiverId and content are required',
          });
          return;
        }

        // Check receiver exists
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
        });

        if (!receiver) {
          send(ws, { type: 'error', msg: 'Receiver not found' });
          return;
        }

        // Save message to DB
        const message = await prisma.message.create({
          data: {
            senderId: authedUser.id,
            receiverId,
            content,
          },
          include: {
            sender: { select: { id: true, username: true } },
            receiver: { select: { id: true, username: true } },
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: receiverId,
            message: `💬 New message from ${message.sender.username}`,
          },
        });

        // Send message if receiver online
        sendToUser(receiverId, { type: 'dm:receive', message });

        return;
      }

      // ── room:join ─────────────────────────────────────────────────────────
      if (type === 'room:join') {
        const roomId = parsed.roomId as number;

        if (!roomId) {
          send(ws, { type: 'error', msg: 'roomId is required' });
          return;
        }

        const participant = await prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId, userId: authedUser.id } },
        });

        if (!participant) {
          send(ws, {
            type: 'error',
            msg: 'You are not a participant of this room',
          });
          return;
        }

        send(ws, { type: 'room:joined', roomId });
        return;
      }

      // ── room:send ─────────────────────────────────────────────────────────
      if (type === 'room:send') {
        const roomId = parsed.roomId as number;
        const content = (parsed.content as string)?.trim();
        const clientTempId = parsed.clientTempId as string | undefined;

        if (!roomId || !content) {
          send(ws, { type: 'error', msg: 'roomId and content are required' });
          return;
        }

        const room = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: { participants: true },
        });

        if (!room) {
          send(ws, { type: 'error', msg: 'Room not found' });
          return;
        }

        if (room.isDisabled) {
          send(ws, {
            type: 'error',
            msg: 'This chat room has been disabled by admin',
          });
          return;
        }

        const isParticipant = room.participants.some(
          (p) => p.userId === authedUser!.id,
        );

        if (!isParticipant) {
          send(ws, {
            type: 'error',
            msg: 'You are not a participant of this room',
          });
          return;
        }

        // Save message
        const roomMessage = await prisma.roomMessage.create({
          data: {
            roomId,
            senderId: authedUser.id,
            message: content,
          },
          include: {
            sender: { select: { id: true, username: true } },
          },
        });

        // Get other participants
        const otherParticipantIds = room.participants
          .filter((p) => p.userId !== authedUser!.id)
          .map((p) => p.userId);

        // Broadcast message to other participants
        for (const uid of otherParticipantIds) {
          sendToUser(uid, {
            type: 'room:message',
            roomId,
            message: roomMessage,
          });
        }

        // Create notifications efficiently
        if (otherParticipantIds.length > 0) {
          await prisma.notification.createMany({
            data: otherParticipantIds.map((uid) => ({
              userId: uid,
              message: `💬 New message in room: ${room.name}`,
            })),
          });
        }

        // Echo back to sender with clientTempId (fix for optimistic UI duplication)
        send(ws, {
          type: 'room:message',
          roomId,
          message: roomMessage,
          clientTempId,
        });

        return;
      }

      // ── Unknown event ─────────────────────────────────────────────────────
      send(ws, { type: 'error', msg: `Unknown event type: ${type}` });
    });

    // ── On disconnect ───────────────────────────────────────────────────────
    ws.on('close', () => {
      if (authedUser) {
        clients.delete(authedUser.id);
        console.log(`WS: User ${authedUser.id} disconnected`);
      }
    });

    ws.on('error', (err) => {
      console.error('WS error:', err);
    });
  });

  console.log('✅ WebSocket server initialized');
  return wss;
};

// ── Export clients map for REST usage ────────────────────────────────────────
export { clients, sendToUser };