"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function EmployeeLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("id, username, name, password, is_active, job_title")
      .eq("username", form.username)
      .eq("password", form.password) // ⚠️ لاحقًا هنشيلها ونعمل تشفير
      .eq("is_active", true)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("بيانات تسجيل الدخول غير صحيحة ❌");
    } else {
      // حفظ بيانات الموظف في localStorage (حل مؤقت كبداية)
      localStorage.setItem("employee", JSON.stringify(data));
      router.push("/employee/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl  font-bold mb-6 text-center">
        تسجيل دخول الموظف
      </h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="اسم المستخدم"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="كلمة المرور"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}
