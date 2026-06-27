"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

export default function AddEmployee() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    job_title: "",
    base_salary: "",
    hire_date: "",
    branch: "",
  });

  const branches = [
    "فاقوس شارع الدروس",
    "فاقوس المنشية الجديدة",
    "أبو كبير",
    "ديرب نجم",
    "دوران رضا",
    "أبو عطوة",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ✅ تأكد أن الراتب رقم
      const baseSalary = parseFloat(form.base_salary) || 0;

      // ✅ 1. أضف الموظف الجديد كـ نشط افتراضيًا
      const { data: employee, error: empError } = await supabase
        .from("employees")
        .insert([
          {
            username: form.username,
            password: form.password,
            name: form.name,
            phone: form.phone,
            job_title: form.job_title,
            hire_date: form.hire_date,
            branch: form.branch,
            is_active: true, // ✅ الموظف الجديد نشط افتراضيًا
          },
        ])
        .select()
        .single();

      if (empError) throw empError;

      // ✅ 2. سجل الراتب الأول بتاريخ اليوم (وليس تاريخ التعيين)
      const { error: salaryError } = await supabase
        .from("salary_history")
        .insert([
          {
            employee_id: employee.id,
            base_salary: baseSalary,
            start_date: new Date().toISOString().split("T")[0], // ✅ تاريخ فعلي
          },
        ]);

      if (salaryError) throw salaryError;

      alert("تم إضافة الموظف بنجاح ✅");
      setForm({
        username: "",
        password: "",
        name: "",
        phone: "",
        job_title: "",
        base_salary: "",
        hire_date: "",
        branch: "",
      });
    } catch (err) {
      console.error(err);
      alert("حدث خطأ ❌");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800">إضافة موظف جديد 👤</h1>
          <p className="text-slate-500 mt-1">تسجيل موظف جديد وتعيين الفرع والراتب الأساسي له.</p>
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

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Account Info */}
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
                placeholder="اسم المستخدم للموظف"
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
                placeholder="كلمة مرور الموظف"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal & Job Info */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            البيانات الشخصية والوظيفية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم الموظف الثنائي أو الثلاثي</label>
              <input
                type="text"
                name="name"
                placeholder="الاسم الكامل للموظف"
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
                placeholder="رقم الموبايل (مثال: 010xxxxxxxx)"
                value={form.phone}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">المسمى الوظيفي</label>
              <input
                type="text"
                name="job_title"
                placeholder="الوظيفة (مثال: بائع، كاشير)"
                value={form.job_title}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الراتب الأساسي</label>
              <input
                type="number"
                name="base_salary"
                placeholder="قيمة الراتب الأساسي الشهري"
                value={form.base_salary}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ التعيين</label>
              <input
                type="date"
                name="hire_date"
                value={form.hire_date}
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
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
        >
          حفظ وإضافة الموظف الجديد
        </button>
      </form>
    </div>
  );
}
