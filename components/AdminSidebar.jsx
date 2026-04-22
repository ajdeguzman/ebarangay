"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { getAdminSession, logoutAdmin } from "@/lib/storage";

const NAV = [
  { href: "/admin/dashboard", label: "Overview", icon: "grid" },
  { href: "/admin/dashboard?tab=requests", label: "Requests", icon: "doc" },
  { href: "/admin/residents", label: "Residents", icon: "users" },
  { href: "/admin/settings", label: "Barangay settings", icon: "cog" },
];

export default function AdminSidebar({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getAdminSession();
        if (cancelled) return;
        if (!s) {
          router.replace("/admin/login");
          return;
        }
        setAdmin(s);
        setLoaded(true);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onLogout = async () => {
    await logoutAdmin();
    router.push("/admin/login");
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen flex">
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] transform transition flex flex-col md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-4 flex items-center border-b border-[rgb(var(--border))] flex-shrink-0">
          <Logo />
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV.map((n) => {
            const active =
              pathname === n.href.split("?")[0] &&
              (!n.href.includes("?") ||
                (typeof window !== "undefined" &&
                  window.location.search.includes(n.href.split("?")[1])));
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`bp-nav-link flex items-center gap-2 ${
                  active ? "bp-nav-link-active" : ""
                }`}
              >
                <NavIcon name={n.icon} />
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={onLogout}
            className="bp-nav-link flex items-center gap-2 w-full text-left text-rose-500 hover:text-rose-500"
          >
            <NavIcon name="logout" />
            Log out
          </button>
        </nav>
        <div className="flex-shrink-0 p-3 border-t border-[rgb(var(--border))]">
          <div className="flex items-center gap-3 p-2">
            <div className="h-9 w-9 rounded-full bg-[rgb(var(--text))] text-[rgb(var(--bg))] flex items-center justify-center font-semibold">
              {(admin?.name?.[0] || admin?.email?.[0] || "A").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {admin?.name || admin?.email || "admin"}
              </div>
              <div className="text-xs text-[rgb(var(--text-muted))]">
                Administrator
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 md:ml-64">
        <div className="md:hidden h-14 px-4 flex items-center justify-between border-b border-[rgb(var(--border))]">
          <button
            onClick={() => setOpen((o) => !o)}
            className="bp-btn-ghost !py-2 !px-3"
          >
            ☰
          </button>
          <Logo />
          <div className="w-8" />
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
        />
      )}
    </div>
  );
}

function NavIcon({ name }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (name === "grid")
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    );
  if (name === "doc")
    return (
      <svg {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  if (name === "users")
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  if (name === "cog")
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  if (name === "logout")
    return (
      <svg {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    );
  return null;
}
