"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession } from "@/lib/storage";

export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    getAdminSession().then((s) => {
      if (cancelled) return;
      router.replace(s ? "/admin/dashboard" : "/admin/login");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);
  return null;
}
