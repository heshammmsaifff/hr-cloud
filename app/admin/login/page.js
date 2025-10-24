"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

        {/* Password field with eye button */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="كلمة السر"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 pr-10 border rounded"
            required
            aria-label="كلمة السر"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 flex items-center px-2"
            aria-pressed={showPassword}
            aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
            title={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          >
            {showPassword ? (
              // Eye-off icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.5-10-8 1-3.5 4-6 8-7m3 3a3 3 0 104 4M3 3l18 18"
                />
              </svg>
            ) : (
              // Eye icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

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
