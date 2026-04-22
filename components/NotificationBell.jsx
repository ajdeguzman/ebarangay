"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  getNotifications,
  markNotificationRead,
  clearNotifications,
} from "@/lib/storage";

function toNotif(r) {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read,
    createdAt: r.created_at,
  };
}

export default function NotificationBell({ align = "right" }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let channel;
    (async () => {
      try {
        const supabase = getSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const notifs = await getNotifications();
        setNotifications(notifs);

        channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              setNotifications((prev) => [toNotif(payload.new), ...prev]);
            }
          )
          .subscribe();
      } catch {}
    })();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const handleClear = async () => {
    await clearNotifications();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative bp-btn-ghost !py-2 !px-2.5"
        aria-label="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-80 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in`}>
          <div className="px-4 py-3 border-b border-[rgb(var(--border))] flex items-center justify-between">
            <div className="font-semibold text-sm">Notifications</div>
            {unread > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[rgb(var(--text-muted))]">
              No notifications yet.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-[rgb(var(--border))]">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[rgb(var(--surface-2))] transition ${
                      !n.read ? "bg-[rgb(var(--surface))]" : ""
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        !n.read ? "bg-rose-500" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-snug">
                        {n.title}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-muted))] mt-0.5 leading-snug">
                        {n.body}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-muted))] mt-1 opacity-70">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
