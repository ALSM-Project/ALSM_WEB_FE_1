import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../api/notifications.api';
import type { NotificationList, SystemNotification } from '../api/notifications.api';

const emptyList: NotificationList = { items: [], unreadCount: 0 };

export const NotificationsBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationList>(emptyList);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setNotifications(await notificationsApi.list());
    } catch {
      // Keep the customer portal usable if notifications are temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((current) => ({
        ...current,
        unreadCount: 0,
        items: current.items.map((item) => ({ ...item, isRead: true })),
      }));
    } catch {
      await refresh();
    }
  };

  const openNotification = async (item: SystemNotification) => {
    if (!item.isRead) {
      try {
        await notificationsApi.markRead(item.id);
        setNotifications((current) => ({
          ...current,
          unreadCount: Math.max(0, current.unreadCount - 1),
          items: current.items.map((notification) =>
            notification.id === item.id ? { ...notification, isRead: true } : notification,
          ),
        }));
      } catch {
        await refresh();
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) void refresh();
        }}
        className="p-2 text-[#42526E] hover:text-[#0652CC] hover:bg-[#F7F9FC] rounded-xl transition-colors relative"
        title="Notifications"
        aria-label={`Notifications${notifications.unreadCount ? `, ${notifications.unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="w-4.5 h-4.5" />
        {notifications.unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-[#0652CC] text-white text-[9px] font-extrabold flex items-center justify-center">
            {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <section className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white border border-[#D9E2EC] rounded-xl shadow-xl z-50 overflow-hidden">
            <header className="px-4 py-3 border-b border-[#E5EAF0] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#091E42]">Notifications</h2>
                <p className="text-[11px] text-[#6B778C]">{notifications.unreadCount} unread</p>
              </div>
              {notifications.unreadCount > 0 && (
                <button type="button" onClick={() => void markAllRead()} className="text-[11px] font-medium text-[#0652CC] hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </header>
            <div className="max-h-[min(26rem,70vh)] overflow-y-auto">
              {notifications.items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-[#6B778C]">You have no notifications yet.</p>
              ) : notifications.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openNotification(item)}
                  className={`w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F7F9FC] ${item.isRead ? '' : 'bg-blue-50/70'}`}
                >
                  <span className="flex items-start gap-2.5">
                    <span className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-[#0652CC]'}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[#091E42]">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#42526E]">{item.message}</span>
                      <time className="mt-1 block text-[10px] text-[#6B778C]">{new Date(item.createdAt).toLocaleString()}</time>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
