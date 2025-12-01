"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditEmployee() {
  const { id } = useParams();
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    job_title: "",
    is_active: true,
    base_salary: "",
    branch: "",
  });

  const [loading, setLoading] = useState(false);

  const branches = [
    "فاقوس شارع الدروس",
    "فاقوس المنشية الجديدة",
    "أبو كبير",
    "ديرب نجم",
    "دوران رضا",
    "أبو عطوة",
  ];

  // جلب بيانات الموظف
  useEffect(() => {
    if (id) fetchEmployee(id);
  }, [id]);

  const fetchEmployee = async (employeeId) => {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        username,
        password,
        id,
        name,
        phone,
        job_title,
        hire_date,
        is_active,
        branch,
        salary_history!salary_history_employee_id_fkey(
          base_salary,
          created_at
        )
      `
      )
      .eq("id", employeeId)
      .single();

    if (!error && data) {
      setEmployee(data);
      setForm({
        username: data.username,
        password: data.password,
        name: data.name,
        phone: data.phone,
        job_title: data.job_title,
        is_active: data.is_active,
        base_salary: data.salary_history?.[0]?.base_salary || "",
        branch: data.branch || "",
      });
    }
  };

  // تعديل البيانات في الفورم
  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "is_active") {
      value = value === "true"; // String -> Boolean
    }
    setForm({ ...form, [e.target.name]: value });
  };

  // حفظ التعديلات
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1- تحديث بيانات الموظف الأساسية
    const { error: empError } = await supabase
      .from("employees")
      .update({
        username: form.username,
        password: form.password,
        name: form.name,
        phone: form.phone,
        job_title: form.job_title,
        is_active: form.is_active,
        branch: form.branch,
      })
      .eq("id", id);

    if (empError) {
      alert("خطأ في تحديث بيانات الموظف ❌");
      setLoading(false);
      return;
    }

    // 2- لو الموظف نشط والراتب اختلف → نضيف سطر جديد في salary_history
    const latestSalary = employee.salary_history?.[0]?.base_salary || 0;
    const newSalary = parseFloat(form.base_salary);

    if (form.is_active && !isNaN(newSalary) && newSalary !== latestSalary) {
      const { error: salaryError } = await supabase
        .from("salary_history")
        .insert([
          {
            employee_id: id,
            base_salary: newSalary,
            start_date: new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString(),
          },
        ]);

      if (salaryError) {
        console.error("Salary insert error:", salaryError);
        alert("❌ خطأ في تحديث الراتب");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    alert("تم حفظ التعديلات ✅");
    router.push("/admin/employees");
  };

  if (!employee) return <div className="p-8 text-white">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">تعديل بيانات الموظف</h1>

      <form onSubmit={handleSave} className="space-y-4">
        {/* 🔵 سكشن بيانات تسجيل الدخول */}
        <div className="border border-blue-300 bg-blue-50 p-4 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-3 text-blue-700">
            بيانات تسجيل الدخول
          </h2>

          <div className="mb-4">
            <label className="block font-semibold mb-1">اسم المستخدم</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">كلمة المرور</label>
            <input
              type="text"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">الاسم</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">الموبايل</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">الوظيفة</label>
          <input
            type="text"
            name="job_title"
            value={form.job_title}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">الراتب الحالي</label>
          <input
            type="number"
            name="base_salary"
            value={form.base_salary}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">الفرع</label>
          <select
            name="branch"
            value={form.branch}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">اختر الفرع</option>
            {branches.map((b, i) => (
              <option key={i} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">نشط</label>
          <select
            name="is_active"
            value={form.is_active}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
