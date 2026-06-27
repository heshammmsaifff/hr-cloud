"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we are on login, we don't need auth check
    if (pathname === "/admin/login") {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    const checkAuth = async (isInitial = false) => {
      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        setAuthorized(false);
        setLoading(false);
        router.push("/admin/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (!user.id || !user.password) {
          // Old session format without password, force log out/re-login to acquire password
          localStorage.removeItem("admin_user");
          setAuthorized(false);
          setLoading(false);
          router.push("/admin/login");
          return;
        }

        const { data, error } = await supabase
          .from("admin_users")
          .select("password")
          .eq("id", user.id)
          .single();

        if (error || !data || data.password !== user.password) {
          // Password has changed or user deleted!
          localStorage.removeItem("admin_user");
          setAuthorized(false);
          setLoading(false);
          alert("انتهت الجلسة! تم تغيير كلمة السر من جهاز آخر أو انتهت صلاحية تسجيل الدخول 🔒");
          router.push("/admin/login");
          return;
        }

        setAuthorized(true);
        setLoading(false);
      } catch (err) {
        localStorage.removeItem("admin_user");
        setAuthorized(false);
        setLoading(false);
        router.push("/admin/login");
      }
    };

    // Run check immediately
    checkAuth(true);

    // Set up periodic check every 10 seconds
    const interval = setInterval(() => {
      checkAuth(false);
    }, 10000);

    // Set up window focus event listener to check when the user focuses the page
    const handleFocus = () => {
      checkAuth(false);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname, router]);

  if (loading && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 font-sans" dir="rtl">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-semibold text-lg">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!authorized && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
