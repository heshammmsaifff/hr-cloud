"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

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
      <h1 className="text-2xl font-bold mb-4">الموظفون السابقون</h1>
      {employees.length === 0 ? (
        <p>لا يوجد موظفون مؤرشفون</p>
      ) : (
        <table className="w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="p-2 border">الاسم</th>
              <th className="p-2 border">الوظيفة</th>
              <th className="p-2 border">الموبايل</th>
              <th className="p-2 border">تاريخ التعيين</th>
              <th className="p-2 border">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="p-2 border">{emp.name}</td>
                <td className="p-2 border">{emp.job_title}</td>
                <td className="p-2 border">{emp.phone}</td>
                <td className="p-2 border">
                  {new Date(emp.hire_date).toLocaleDateString("ar-EG")}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleRehire(emp.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    إرجاع للعمل
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
