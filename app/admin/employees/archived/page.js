"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

export default function ArchivedEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, phone, job_title, hire_date, is_active")
      .eq("is_active", false)
      .order("hire_date", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setEmployees(data);
    }
    setLoading(false);
  };

  const handleRehire = async (id) => {
    const confirmRehire = window.confirm(
      "هل أنت متأكد أنك تريد إرجاع هذا الموظف للعمل؟"
    );

    if (!confirmRehire) return; // لو المستخدم لغى العملية، نخرج بدون تنفيذ

    const { error } = await supabase
      .from("employees")
      .update({ is_active: true })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل في إرجاع الموظف ❌");
    } else {
      alert("تم إرجاع الموظف للعمل ✅");
      fetchEmployees();
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-semibold text-lg">جاري تحميل الأرشيف...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen font-sans" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-sans">الموظفون السابقون (الأرشيف) 📁</h1>
          <p className="text-slate-500 mt-1">عرض وإرجاع الموظفين الذين تم إيقاف نشاطهم.</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="mt-4 sm:mt-0 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للوحة التحكم
        </Link>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <p className="text-slate-500 text-lg font-medium">لا يوجد موظفون مؤرشفون حالياً.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 text-sm font-bold">
                  <th className="p-4 sm:p-5">الاسم</th>
                  <th className="p-4 sm:p-5">الوظيفة</th>
                  <th className="p-4 sm:p-5">الموبايل</th>
                  <th className="p-4 sm:p-5">تاريخ التعيين</th>
                  <th className="p-4 sm:p-5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 sm:p-5 font-bold text-slate-850">
                      {emp.name}
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600 font-medium">{emp.job_title}</td>
                    <td className="p-4 sm:p-5 text-slate-500 font-mono">{emp.phone}</td>
                    <td className="p-4 sm:p-5 text-slate-500">
                      {new Date(emp.hire_date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-4 sm:p-5">
                      <div className="flex gap-2 justify-center">
                        <Link
                          href={`/admin/employees/transactions/${emp.id}`}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition"
                        >
                          💸 المعاملات السابقة
                        </Link>
                        <button
                          onClick={() => handleRehire(emp.id)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition"
                        >
                          🔄 إرجاع للعمل
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
