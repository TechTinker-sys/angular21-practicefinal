import { Router, Request } from 'express';
import { randomUUID } from 'node:crypto';
import { usersStore, type PublicUser } from './auth';

export type NotificationType = 'note_created' | 'note_approved';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  noteId?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsStore = new Map<string, Notification>();

const router = Router();

function getRequestUser(req: Request): PublicUser {
  return (req as Request & { user?: PublicUser }).user as PublicUser;
}

export function notifyUser(
  recipientId: string,
  type: NotificationType,
  message: string,
  noteId?: string,
): Notification {
  const notification: Notification = {
    id: randomUUID(),
    recipientId,
    type,
    message,
    noteId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notificationsStore.set(notification.id, notification);
  return notification;
}

export function notifyAllAdmins(
  type: NotificationType,
  message: string,
  noteId?: string,
): void {
  const admins = Array.from(usersStore.values()).filter((user) => user.role === 'admin');
  for (const admin of admins) {
    notifyUser(admin.id, type, message, noteId);
  }
}

// GET /api/notifications — current user's notifications, newest first.
router.get('/', (req, res) => {
  const user = getRequestUser(req);
  const notifications = Array.from(notificationsStore.values())
    .filter((notification) => notification.recipientId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  return res.json({ notifications, unreadCount, total: notifications.length });
});

// PUT /api/notifications/read-all — mark all of the current user's notifications as read.
router.put('/read-all', (req, res) => {
  const user = getRequestUser(req);
  for (const notification of notificationsStore.values()) {
    if (notification.recipientId === user.id) {
      notification.read = true;
    }
  }
  return res.status(204).send();
});

// PUT /api/notifications/:id/read — mark a single notification as read.
router.put('/:id/read', (req, res) => {
  const user = getRequestUser(req);
  const notification = notificationsStore.get(req.params['id'] as string);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.recipientId !== user.id) {
    return res.status(403).json({ error: 'You do not have permission to modify this notification' });
  }

  notification.read = true;
  return res.json(notification);
});

export { router as notificationsRouter };