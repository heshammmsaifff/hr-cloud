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
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">لوحة تحكم المحاسب</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <Link
            key={i}
            href={card.link}
            className={`flex items-center justify-center p-6 rounded-2xl shadow text-white font-semibold text-xl transition ${card.color}`}
          >
            {card.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
