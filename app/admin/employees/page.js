"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("");

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
      .eq("is_active", true); // ✅ عرض الموظفين النشطين فقط

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

    if (!confirmDelete) return; // لو المستخدم لغى العملية، نخرج بدون تنفيذ

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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center sm:text-right">
        الموظفون الحاليون
      </h1>

      {/* فلتر الفروع */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <label className="text-gray-700 font-medium">فلتر الفرع:</label>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border rounded-lg p-2 w-full sm:w-auto bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="">كل الفروع</option>
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {employees.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا يوجد موظفون حاليًا</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-right min-w-[800px]">
            <thead>
              <tr className="bg-blue-50 text-blue-800 text-[15px]">
                <th className="p-3 border-b">الاسم</th>
                <th className="p-3 border-b">الوظيفة</th>
                <th className="p-3 border-b">الموبايل</th>
                <th className="p-3 border-b">تاريخ التعيين</th>
                <th className="p-3 border-b">الراتب الحالي</th>
                <th className="p-3 border-b">آخر تحديث راتب</th>
                <th className="p-3 border-b">الفرع</th>
                <th className="p-3 border-b text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 transition-colors border-b"
                >
                  <td className="p-3 font-semibold text-gray-800">
                    {emp.name}
                  </td>
                  <td className="p-3 text-gray-600">{emp.job_title}</td>
                  <td className="p-3 text-gray-700">{emp.phone}</td>
                  <td className="p-3 text-gray-700">
                    {new Date(emp.hire_date).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-3 text-green-600 font-bold">
                    {emp.base_salary !== "غير محدد"
                      ? `${emp.base_salary} ج.م`
                      : "غير محدد"}
                  </td>
                  <td className="p-3 text-gray-700">
                    {emp.salary_updated_at
                      ? new Date(emp.salary_updated_at).toLocaleDateString(
                          "ar-EG"
                        )
                      : "—"}
                  </td>
                  <td className="p-3 text-gray-700">{emp.branch || "-"}</td>
                  <td className="p-3 flex flex-wrap gap-2 justify-center">
                    <Link
                      href={`/admin/employees/transactions/${emp.id}`}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                    >
                      معاملات
                    </Link>
                    <Link
                      href={`/admin/employees/edit/${emp.id}`}
                      className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition"
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
