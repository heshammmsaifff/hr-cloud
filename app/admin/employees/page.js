"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const branches = [
    "فاقوس شارع الدروس",
    "فاقوس المنشية الجديدة",
    "أبو كبير",
    "ديرب نجم",
    "دوران رضا",
    "أبو عطوة",
  ];

  const fetchEmployees = async () => {
    setLoading(true);

    let query = supabase
      .from("employees")
      .select("id, name, phone, job_title, hire_date, is_active, branch")
      .eq("is_active", true);

    if (branchFilter) query = query.eq("branch", branchFilter);
    query = query.order("hire_date", { ascending: true });

    const { data: employeesData, error } = await query;
    if (error) {
      console.error(error);
      setEmployees([]);
      setLoading(false);
      return;
    }

    const employeesWithSalary = await Promise.all(
      employeesData.map(async (emp) => {
        const { data: salaryHistory } = await supabase
          .from("salary_history")
          .select("base_salary, created_at")
          .eq("employee_id", emp.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!emp.is_active) return emp;

        return {
          ...emp,
          base_salary: salaryHistory?.base_salary || "غير محدد",
          salary_updated_at: salaryHistory?.created_at || null,
        };
      })
    );

    setEmployees(employeesWithSalary);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد أنك تريد نقل هذا الموظف إلى الأرشيف؟"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل في الحذف ❌");
    } else {
      alert("تم نقل الموظف للأرشيف ✅");
      fetchEmployees();
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [branchFilter]);

  if (loading) return <p className="text-center mt-6">جار التحميل...</p>;

  // ⭐ فلترة حسب الاسم
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen font-sans" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800">الموظفون الحاليون 👥</h1>
          <p className="text-slate-500 mt-1">عرض وإدارة جميع موظفي فروع سلطان جروب النشطين.</p>
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

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Branch Filter dropdown */}
        <div className="relative w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full sm:w-60 border border-slate-200 rounded-xl p-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer pl-10 pr-4 text-slate-700 font-bold"
          >
            <option value="">كل الفروع 🏢</option>
            {branches.map((b, i) => (
              <option key={i} value={b}>
                {b}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 🔍 Search Input */}
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="ابحث بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10 text-slate-700 font-medium"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Employees Table Container */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-slate-500 text-lg font-medium">لا يوجد موظفون مطابقتهم لشروط البحث.</p>
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
                  <th className="p-4 sm:p-5">الراتب الحالي</th>
                  <th className="p-4 sm:p-5">آخر تحديث راتب</th>
                  <th className="p-4 sm:p-5">الفرع</th>
                  <th className="p-4 sm:p-5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 sm:p-5 font-bold text-slate-800">
                      {emp.name}
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600 font-medium">{emp.job_title}</td>
                    <td className="p-4 sm:p-5 text-slate-500 font-mono">{emp.phone}</td>
                    <td className="p-4 sm:p-5 text-slate-500">
                      {new Date(emp.hire_date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-extrabold">
                        {emp.base_salary !== "غير محدد"
                          ? `${emp.base_salary} ج.م`
                          : "غير محدد"}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400 font-medium">
                      {emp.salary_updated_at
                        ? new Date(emp.salary_updated_at).toLocaleDateString("ar-EG")
                        : "—"}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-bold text-xs">
                        {emp.branch || "غير محدد"}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5">
                      <div className="flex gap-2 justify-center">
                        <Link
                          href={`/admin/employees/transactions/${emp.id}`}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition"
                        >
                          💸 المعاملات
                        </Link>
                        <Link
                          href={`/admin/employees/edit/${emp.id}`}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition"
                        >
                          ✏️ تعديل
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition"
                        >
                          🗑️ حذف
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
