import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { IconCheckCircle, IconX } from "./Icons";

export default function HeaderNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.warn("Could not fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Failed marking notification as read", err);
    }
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed marking all read", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="focus-ring relative inline-flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white border border-purple-200/80 px-3.5 py-2 text-xs font-semibold text-indigo-950 shadow-sm transition-all"
        title="View Notifications"
      >
        <span className="text-sm">🔔</span>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-status-danger px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-strong border border-purple-200/90 shadow-glow z-50 animate-fade-in p-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h3 className="font-display font-semibold text-sm text-indigo-950">
                Notifications ({unreadCount} unread)
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-accent-blue hover:underline focus-ring rounded"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-purple-900/60 font-medium">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    !n.read
                      ? "bg-purple-100/70 border-purple-300/80 shadow-sm"
                      : "bg-white/60 border-purple-100 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-indigo-950 text-xs">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-status-danger shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-purple-900/80 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-purple-900/50 font-mono mt-1.5 block">
                    {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
