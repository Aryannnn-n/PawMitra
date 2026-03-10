import { Router } from 'express';
import {
  getDmHistory,
  getMyRooms,
  getRecentContacts,
  getRoomHistory,
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const ChatRouter = Router();

// All chat routes require authentication
ChatRouter.use(requireAuth);

ChatRouter.get('/recent-contacts', getRecentContacts);  

// GET /api/chat/dm/:userId       → DM history with a specific user
ChatRouter.get('/dm/:userId', getDmHistory);

// GET /api/chat/rooms            → all rooms current user is part of
ChatRouter.get('/rooms', getMyRooms);

// GET /api/chat/rooms/:roomId    → full message history for a room
ChatRouter.get('/rooms/:roomId', getRoomHistory);

export default ChatRouter;
