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

  // تحميل الموظفين مع الراتب الحالي
  const fetchEmployees = async () => {
    setLoading(true);

    let query = supabase
      .from("employees")
      .select("id, name, phone, job_title, hire_date, is_active, branch");

    if (branchFilter) query = query.eq("branch", branchFilter);

    query = query.order("hire_date", { ascending: true });

    const { data: employeesData, error } = await query;

    if (error) {
      console.error(error);
      setEmployees([]);
      setLoading(false);
      return;
    }

    // جلب آخر راتب لكل موظف
    const employeesWithSalary = await Promise.all(
      employeesData.map(async (emp) => {
        const { data: salaryHistory } = await supabase
          .from("salary_history")
          .select("base_salary, created_at")
          .eq("employee_id", emp.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

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

  // حذف موظف (أرشفة)
  const handleDelete = async (id) => {
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
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4">الموظفون الحاليون</h1>

      {/* فلتر الفروع */}
      <div className="mb-4 flex items-center gap-4">
        <label>فلتر الفرع:</label>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border rounded p-2"
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
        <p>لا يوجد موظفون حاليًا</p>
      ) : (
        <table className="w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="p-2 border">الاسم</th>
              <th className="p-2 border">الوظيفة</th>
              <th className="p-2 border">الموبايل</th>
              <th className="p-2 border">تاريخ التعيين</th>
              <th className="p-2 border">الراتب الحالي</th>
              <th className="p-2 border">آخر تحديث راتب</th>
              <th className="p-2 border">الفرع</th>
              <th className="p-2 border">الحالة</th>
              <th className="p-2 border">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="p-2 border font-semibold">{emp.name}</td>
                <td className="p-2 border">{emp.job_title}</td>
                <td className="p-2 border">{emp.phone}</td>
                <td className="p-2 border">
                  {new Date(emp.hire_date).toLocaleDateString("ar-EG")}
                </td>
                <td className="p-2 border text-green-600 font-bold">
                  {emp.base_salary !== "غير محدد"
                    ? `${emp.base_salary} ج.م`
                    : "غير محدد"}
                </td>
                <td className="p-2 border">
                  {emp.salary_updated_at
                    ? new Date(emp.salary_updated_at).toLocaleDateString(
                        "ar-EG"
                      )
                    : "—"}
                </td>
                <td className="p-2 border">{emp.branch || "-"}</td>
                <td
                  className={`p-2 border font-bold ${
                    emp.is_active ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {emp.is_active ? "نشط" : "مؤرشف"}
                </td>
                <td className="p-2 border flex flex-wrap gap-2">
                  <Link
                    href={`/admin/employees/transactions/${emp.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    معاملات
                  </Link>
                  <Link
                    href={`/admin/employees/edit/${emp.id}`}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    تعديل
                  </Link>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
