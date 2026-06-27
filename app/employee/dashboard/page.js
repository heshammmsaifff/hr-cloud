"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [isArchived, setIsArchived] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const emp = localStorage.getItem("employee");
    if (!emp) {
      router.push("/employee/login");
    } else {
      try {
        const parsed = JSON.parse(emp);
        setEmployee(parsed);
        // استخدم حالة التخزين المحلية كقيمة أولية — لكن سنجلب الحالة من السيرفر لاحقًا
        setIsArchived(parsed.is_active === false);
      } catch (e) {
        router.push("/employee/login");
      }
    }
  }, [router]);

  // جلب الراتب الحالي فقط إذا الموظف غير مؤرشف (ونتحقق من الحالة على السيرفر أولاً)
  useEffect(() => {
    if (!employee) return;

    const fetchSalary = async () => {
      setLoadingSalary(true);

      try {
        // 1) نتحقق من حالة الموظف من السيرفر (عمود is_active موجود في السكيما عندك)
        const { data: empStatus, error: empError } = await supabase
          .from("employees")
          .select("is_active")
          .eq("id", employee.id)
          .single();

        if (empError) {
          console.error("خطأ في جلب حالة الموظف:", empError);
          // في حالة خطأ في جلب الحالة نترك الحالة المحلية كما هي ونحاول جلب الراتب
        } else if (empStatus) {
          // إذا is_active === false => الموظف مؤرشف (archived)
          const archived = empStatus.is_active === false;
          setIsArchived(archived);
          if (archived) {
            // مؤرشف — منع جلب/تحديث الراتب
            setSalary(null);
            setLoadingSalary(false);
            return;
          }
        }

        // 2) الموظف فعال — جلب آخر سجل راتب فعّال
        const todayStr = new Date().toISOString().split("T")[0];

        const { data: salaryRow, error: salaryError } = await supabase
          .from("salary_history")
          .select("base_salary")
          .eq("employee_id", employee.id)
          .lte("start_date", todayStr)
          .or(`end_date.is.null,end_date.gte.${todayStr}`)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (salaryError) {
          console.error("خطأ في جلب الراتب:", salaryError);
        } else if (salaryRow) {
          setSalary(salaryRow.base_salary);
        } else {
          setSalary(null);
        }
      } catch (err) {
        console.error("خطأ غير متوقع أثناء جلب الراتب:", err);
      } finally {
        setLoadingSalary(false);
      }
    };

    fetchSalary();
  }, [employee]);

  if (!employee) return null;

  const handleLogout = () => {
    localStorage.removeItem("employee");
    router.push("/employee/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-right" dir="rtl">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-100/50 blur-[80px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-100/50 blur-[80px] opacity-60"></div>

      <div className="max-w-xl mx-auto w-full z-10">
        {/* Profile Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10 overflow-hidden relative">
          
          {/* Top Actions: Logout */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">بوابة الموظف 👤</span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition flex items-center gap-1"
            >
              تسجيل الخروج
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* User Info Header with Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
              👨‍💼
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">مرحبًا، {employee.name} 👋</h1>
              <p className="text-slate-400 text-sm mt-0.5">{employee.job_title}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl">
            <p className="flex justify-between">
              <span className="font-bold text-slate-500">اسم المستخدم:</span>
              <span className="font-semibold text-slate-800">{employee.username}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-bold text-slate-500">الوظيفة الحالية:</span>
              <span className="font-semibold text-slate-800">{employee.job_title}</span>
            </p>
          </div>

          {/* Salary Block */}
          <div className="mb-6 p-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md">
            <p className="text-xs font-bold opacity-80">الراتب الأساسي الحالي</p>
            {isArchived ? (
              <div className="mt-2 text-sm font-bold text-amber-250 flex items-center gap-1.5">
                ⚠️ هذا الحساب مؤرشف — لا يتم تحديث الراتب بعد تاريخ الأرشفة.
              </div>
            ) : (
              <p className="text-2xl font-black mt-1">
                {loadingSalary ? (
                  <span className="text-sm font-normal">جاري التحميل...</span>
                ) : salary !== null ? (
                  `${salary.toFixed(2)} ج.م`
                ) : (
                  "لم يتم تحديد راتب بعد"
                )}
              </p>
            )}
          </div>

          <Link
            href="/employee/dashboard/salary"
            className={`w-full py-3.5 px-4 text-center rounded-2xl shadow-sm font-bold transition flex items-center justify-center gap-1.5 ${
              isArchived
                ? "bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            📊 عرض تفاصيل الراتب والمعاملات
          </Link>

          {/* Notice Box */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs leading-relaxed">
            <h2 className="font-black text-sm mb-1.5 text-amber-900">⚠️ ملاحظة هامة جداً:</h2>
            <p className="mb-1">نحن في فترة تشغيل تجريبية للبرنامج، لذا قد تحتوي بعض الحسابات على أخطاء حسابية غير مقصودة.</p>
            <p className="font-semibold">إذا لاحظت أي اختلاف أو خطأ في مستحقاتك المالية أو الإجازات، يرجى إخطار المحاسب فوراً لمراجعة حسابك وتصحيحه بأسرع وقت.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
