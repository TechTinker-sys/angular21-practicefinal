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

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}