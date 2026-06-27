"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import Link from "next/link";

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

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-semibold text-lg">جاري تحميل بيانات الموظف...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800">تعديل بيانات الموظف ✏️</h1>
          <p className="text-slate-500 mt-1">تحديث الملف الشخصي أو تعديل الراتب والفرع للموظف {employee.name}.</p>
        </div>
        <Link
          href="/admin/employees"
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
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
          العودة لقائمة الموظفين
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Info Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            بيانات الحساب (تسجيل الدخول)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <input
                type="text"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Personal & Job Info Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            البيانات الشخصية والوظيفية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم الموبايل</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الوظيفة</label>
              <input
                type="text"
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الراتب الحالي</label>
              <input
                type="number"
                name="base_salary"
                value={form.base_salary}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الفرع</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-bold text-slate-700"
                required
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
              <label className="block text-sm font-bold text-slate-700 mb-2">حالة الحساب</label>
              <select
                name="is_active"
                value={form.is_active}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-bold text-slate-700"
                required
              >
                <option value="true">نشط (يعمل بالشركة)</option>
                <option value="false">غير نشط (مؤرشف)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              جاري حفظ التعديلات...
            </div>
          ) : (
            "حفظ التغييرات"
          )}
        </button>
      </form>
    </div>
  );
}
