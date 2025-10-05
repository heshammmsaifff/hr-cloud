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

  if (loading) return <p className="text-center mt-6">جار التحميل...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center sm:text-right">
        الموظفون السابقون
      </h1>

      {employees.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا يوجد موظفون مؤرشفون</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-right min-w-[700px]">
            <thead>
              <tr className="bg-blue-50 text-blue-800 text-[15px]">
                <th className="p-3 border-b">الاسم</th>
                <th className="p-3 border-b">الوظيفة</th>
                <th className="p-3 border-b">الموبايل</th>
                <th className="p-3 border-b">تاريخ التعيين</th>
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
                  <td className="p-3 flex flex-wrap gap-2 justify-center">
                    <Link
                      href={`/admin/employees/transactions/${emp.id}`}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                    >
                      معاملات
                    </Link>
                    <button
                      onClick={() => handleRehire(emp.id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                    >
                      إرجاع للعمل
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
