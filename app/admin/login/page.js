"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", form.username)
      .eq("password", form.password)
      .single();

    if (error || !data) {
      alert("خطأ في اسم المستخدم أو كلمة السر ❌");
      setLoading(false);
      return;
    }

    localStorage.setItem(
      "admin_user",
      JSON.stringify({ id: data.id, username: data.username })
    );

    router.push("/admin/dashboard");
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow mt-20">
      <h1 className="text-2xl font-bold border rounded-2xl bg-green-400 h-[50px] pt-2 mb-6 text-center">
        تسجيل دخول الإدارة
      </h1>
      <h2 className="text-2xl font-bold mb-6 text-center border rounded-3xl bg-red-500">
        إذا كنت موظف و وصلت الي هذه الصفحة . برجاء المغادرة و عدم محاولة الدخول
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="كلمة السر"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "جاري تسجيل الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
