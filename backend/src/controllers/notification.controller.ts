import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// ── GET /api/notifications ────────────────────────────────────────────────────
// Get all notifications for current user, marks all as read on fetch
export const getNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({ notifications, total: notifications.length });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/notifications/unread-count ───────────────────────────────────────
// Lightweight poll — just returns the unread count (used for badge in navbar)
export const getUnreadCount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
// Mark a single notification as read
export const markOneRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const notifId = parseInt(req.params.id as string, 10);
    if (isNaN(notifId)) {
      res.status(400).json({ msg: 'Invalid notification ID' });
      return;
    }

    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notif) {
      res.status(404).json({ msg: 'Notification not found' });
      return;
    }

    // Users can only mark their own notifications
    if (notif.userId !== req.user!.id) {
      res.status(403).json({ msg: 'Forbidden' });
      return;
    }

    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });

    res.status(200).json({ msg: 'Notification marked as read' });
  } catch (error) {
    console.error('markOneRead error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
export const deleteNotification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const notifId = parseInt(req.params.id as string, 10);
    if (isNaN(notifId)) {
      res.status(400).json({ msg: 'Invalid notification ID' });
      return;
    }

    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notif) {
      res.status(404).json({ msg: 'Notification not found' });
      return;
    }

    if (notif.userId !== req.user!.id) {
      res.status(403).json({ msg: 'Forbidden' });
      return;
    }

    await prisma.notification.delete({ where: { id: notifId } });

    res.status(200).json({ msg: 'Notification deleted' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
