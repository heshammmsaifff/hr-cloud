"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("admin_user");
    if (!user) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const cards = [
    {
      title: "إضافة موظف جديد",
      link: "/admin/employees/new",
      color: "from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-100",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      title: "عرض الموظفين الحاليين",
      link: "/admin/employees",
      color: "from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-100",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "الموظفين السابقين",
      link: "/admin/employees/archived",
      color: "from-slate-500 to-slate-600 hover:shadow-lg hover:shadow-slate-100",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    {
      title: "تغيير كلمة السر",
      link: "/admin/change-password",
      color: "from-violet-500 to-violet-600 hover:shadow-lg hover:shadow-violet-100",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans min-h-screen relative" dir="rtl">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-violet-100/40 blur-[80px] opacity-60"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-100/40 blur-[80px] opacity-60"></div>

      <div className="z-10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 border-b pb-6 border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">لوحة تحكم المحاسب 💼</h1>
            <p className="text-slate-500 mt-1">مرحباً بك مجدداً في نظام الإدارة المالية.</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-3 rounded-2xl shadow-sm transition duration-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            تسجيل الخروج
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <Link
              key={i}
              href={card.link}
              className={`group flex flex-col justify-between p-6 h-48 rounded-3xl shadow-sm text-white font-bold bg-gradient-to-br transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl ${card.color}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition duration-300">
                {card.icon}
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-xl font-bold tracking-wide">{card.title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70 group-hover:translate-x-[-4px] transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
