import { Router } from 'express';
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markOneRead,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const NotificationRouter = Router();

NotificationRouter.use(requireAuth);

// GET    /api/notifications               → all notifications (marks all as read)
NotificationRouter.get('/', getNotifications);

// GET    /api/notifications/unread-count  → just the badge count
// ⚠️  Must be BEFORE /:id
NotificationRouter.get('/unread-count', getUnreadCount);

// PATCH  /api/notifications/:id/read     → mark one as read
NotificationRouter.patch('/:id/read', markOneRead);

// DELETE /api/notifications/:id          → delete one
NotificationRouter.delete('/:id', deleteNotification);

export default NotificationRouter;
