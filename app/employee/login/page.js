"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function EmployeeLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      .eq("password", form.password)
      .eq("is_active", true)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("بيانات تسجيل الدخول غير صحيحة ❌");
    } else {
      localStorage.setItem("employee", JSON.stringify(data));
      router.push("/employee/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans" dir="rtl">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-100/50 blur-[100px] opacity-60"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Back Link */}

        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800">تسجيل دخول الموظف 👤</h1>
            <p className="mt-2 text-sm text-slate-500">
              أدخل بياناتك لمراجعة راتبك الأساسي ومعاملاتك المالية.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <input
                type="text"
                name="username"
                placeholder="أدخل اسم المستخدم"
                value={form.username}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Password field with eye button */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pl-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center px-3 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {showPassword ? "إخفاء" : "عرض"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
