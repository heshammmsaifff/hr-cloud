"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

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
      // 1. أضف الموظف
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
          },
        ])
        .select()
        .single();

      if (empError) throw empError;

      // 2. سجل الراتب الأول
      const { error: salaryError } = await supabase
        .from("salary_history")
        .insert([
          {
            employee_id: employee.id,
            base_salary: form.base_salary,
            start_date: form.hire_date,
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
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4">إضافة موظف جديد</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="name"
          placeholder="اسم الموظف"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="رقم الموبايل"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="job_title"
          placeholder="الوظيفة"
          value={form.job_title}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          name="base_salary"
          placeholder="الراتب"
          value={form.base_salary}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          name="hire_date"
          value={form.hire_date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* اختيار الفرع */}
        <select
          name="branch"
          value={form.branch}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">اختر الفرع</option>
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          إضافة
        </button>
      </form>
    </div>
  );
}
