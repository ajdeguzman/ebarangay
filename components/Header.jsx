"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import {
  getCurrentResident,
  logoutResident,
  onAuthChange,
} from "@/lib/storage";

export default function Header() {
  const [resident, setResident] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      getCurrentResident()
        .then((r) => !cancelled && setResident(r))
        .catch(() => !cancelled && setResident(null));
    };
    refresh();
    const unsub = onAuthChange(() => refresh());
    return () => {
      cancelled = true;
      unsub();
    };
  }, [pathname]);

  const onLogout = async () => {
    await logoutResident();
    setResident(null);
    router.push("/");
  };

  const isActive = (p) => pathname === p;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-[rgb(var(--bg))]/75 border-b border-[rgb(var(--border))]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`bp-nav-link ${isActive("/") ? "bp-nav-link-active" : ""}`}
          >
            Home
          </Link>
          {resident && (
            <Link
              href="/dashboard"
              className={`bp-nav-link ${
                pathname?.startsWith("/dashboard") ? "bp-nav-link-active" : ""
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {resident ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--surface-2))]">
                <div className="h-7 w-7 rounded-full overflow-hidden bg-[rgb(var(--text))] text-[rgb(var(--bg))] text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {resident.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resident.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>{resident.firstName?.[0]}{resident.lastName?.[0]}</>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {resident.firstName}
                </span>
              </div>
              <button onClick={onLogout} className="bp-btn-ghost !py-2 !px-3">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bp-btn-ghost !py-2 !px-3 hidden sm:inline-flex"
              >
                Log in
              </Link>
              <Link href="/register" className="bp-btn-primary !py-2 !px-4">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
