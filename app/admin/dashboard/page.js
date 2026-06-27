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
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "عرض الموظفين الحاليين",
      link: "/admin/employees",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "الموظفين السابقين",
      link: "/admin/employees/archived",
      color: "bg-gray-600 hover:bg-gray-700",
    },
    {
      title: "تغيير كلمة السر",
      link: "/admin/change-password",
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans animate-fade-in" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-6 border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم المحاسب 💼</h1>
        <button
          onClick={handleLogout}
          className="mt-4 sm:mt-0 bg-rose-500 hover:bg-rose-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition duration-200 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
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
            className={`flex items-center justify-center text-center p-6 h-32 rounded-2xl shadow-sm text-white font-bold text-lg transition duration-200 transform hover:-translate-y-1 hover:shadow-md ${card.color}`}
          >
            {card.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
