import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import type { Notification } from '@/types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await apiFetch<{ notifications: Notification[] }>('/api/notifications');
        setNotifications(data.notifications);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(n => n.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    // Re-fetch with GET which auto-marks all as read
    try {
      const data = await apiFetch<{ notifications: Notification[] }>('/api/notifications');
      setNotifications(data.notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 mb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                {unreadCount}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">You're all caught up!</p>
            <p className="text-sm mt-1">No notifications yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition
                  ${n.isRead
                    ? 'bg-white border-gray-100'
                    : 'bg-indigo-50 border-indigo-100'
                  }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  {n.isRead
                    ? <div className="w-2 h-2 rounded-full bg-gray-200" />
                    : <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}