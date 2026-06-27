"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

export default function SalaryPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [salaryData, setSalaryData] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    const emp = localStorage.getItem("employee");
    if (!emp) {
      alert("يرجى تسجيل الدخول أولا");
      return;
    }
    setEmployeeId(JSON.parse(emp).id);
  }, []);

  useEffect(() => {
    if (employeeId) fetchSalary();
  }, [employeeId, month, year]);

  const fetchSalary = async () => {
    if (!employeeId) return;

    // ✅ جلب حالة الموظف (بدون archive_date لتفادي الخطأ)
    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select("is_active, hire_date, is_archived, archive_date")
      .eq("id", employeeId)
      .single();

    if (empError || !empData) {
      console.error("خطأ في جلب بيانات الموظف:", empError);
      return;
    }

    // ✅ تحديد حالة الأرشفة
    const archived = empData.is_active === false || empData.archived === true;
    setIsArchived(archived);

    const hireDate = empData.hire_date
      ? new Date(empData.hire_date)
      : new Date("2000-01-01");
    const selectedDate = new Date(year, month - 1, 1);

    if (
      selectedDate < new Date(hireDate.getFullYear(), hireDate.getMonth(), 1) ||
      selectedDate > new Date(today.getFullYear(), today.getMonth(), 1)
    ) {
      setSalaryData(null);
      return;
    }

    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    // 🟢 جلب آخر راتب قبل نهاية الشهر
    const { data: salaryHistory } = await supabase
      .from("salary_history")
      .select("base_salary, created_at")
      .eq("employee_id", employeeId)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!salaryHistory) {
      setSalaryData(null);
      return;
    }

    const baseSalary = salaryHistory.base_salary;
    const dailyRate = baseSalary / 26;

    // 🟢 لو مؤرشف، نمنع احتساب بعد تاريخ الأرشفة
    let effectiveEndDate = new Date(endDate);
    const archiveDate = empData.archive_date
      ? new Date(empData.archive_date)
      : null;

    if (archived && archiveDate) {
      if (
        selectedDate.getFullYear() === archiveDate.getFullYear() &&
        selectedDate.getMonth() === archiveDate.getMonth()
      ) {
        effectiveEndDate = archiveDate;
      } else if (selectedDate > archiveDate) {
        setSalaryData(null);
        return;
      }
    }

    // 🟢 جلب المعاملات
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date", startDate)
      .lte("date", endDate);

    // 🧮 حساب المعاملات
    let bonus = 0,
      deduction = 0,
      advance = 0,
      leaveDays = 0,
      leaveDeduction = 0,
      absenceDeduction = 0;

    transactions?.forEach((t) => {
      const val = Number(t.amount) || 0;

      if (t.type === "bonus") bonus += val;
      if (t.type === "deduction") deduction += val;
      if (t.type === "advance") advance += val;

      if (t.leave_day) leaveDays += 1;
      if (t.absence_day) {
        absenceDeduction += dailyRate;
        deduction += dailyRate;
      }
    });

    // 🟢 أول 4 أيام إجازة مجانية
    const payableLeaveDays = leaveDays > 4 ? leaveDays - 4 : 0;
    leaveDeduction = payableLeaveDays * dailyRate;
    deduction += leaveDeduction;

    // 🟢 تحديد الأيام المستحقة
    let daysWorked;

    if (year === today.getFullYear() && month === today.getMonth() + 1) {
      // الشهر الحالي → نحسب لحد النهارده
      daysWorked = today.getDate() - leaveDays;
    } else {
      // أي شهر سابق → نحسب عدد أيام الشهر الحقيقي
      const daysInMonth = new Date(year, month, 0).getDate();
      daysWorked = daysInMonth - leaveDays;
    }

    // 🛑 منع الزيادة بعد تاريخ الأرشفة
    if (archived && archiveDate) {
      if (
        archiveDate.getFullYear() === year &&
        archiveDate.getMonth() + 1 === month
      ) {
        daysWorked = archiveDate.getDate();
      } else if (selectedDate > archiveDate) {
        daysWorked = 0;
      }
    }

    const earnedSalary = dailyRate * daysWorked;
    const netSalary = earnedSalary + bonus - deduction - advance;

    setSalaryData({
      baseSalary,
      dailyRate,
      earnedSalary,
      bonus,
      deduction,
      advance,
      leaveDeduction,
      absenceDeduction,
      leaveDays,
      netSalary,
      transactions,
    });
  };

  const translateType = (type, leave_day, absence_day) => {
    if (leave_day) return "إجازة يوم";
    if (absence_day) return "غياب يوم";
    if (type === "bonus") return "علاوة / إضافة";
    if (type === "deduction") return "خصم";
    if (type === "advance") return "سلفة";
    return type;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen font-sans text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800">كشف الراتب الشهري 📊</h1>
          <p className="text-slate-500 mt-1">
            مراجعة كافة مستحقاتك، علاواتك، وخصوماتك لشهر <span className="font-bold text-blue-600">{month}</span> لسنة <span className="font-bold text-blue-600">{year}</span>
          </p>
        </div>
        <Link
          href="/employee/dashboard"
          className="mt-4 sm:mt-0 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
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
          العودة لبوابة الموظف
        </Link>
      </div>

      {/* Date Selectors */}
      <div className="mb-6 flex gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">الشهر:</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-xl p-2 bg-white font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">السنة:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-xl p-2 bg-white font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {salaryData ? (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Base Salary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">الراتب الأساسي</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{salaryData.baseSalary.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-lg">
                💵
              </div>
            </div>

            {/* Daily Rate */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">الأجر اليومي (26 يوم)</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{salaryData.dailyRate.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-lg">
                📅
              </div>
            </div>

            {/* Earned Salary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">المستحق الفعلي حتى الآن</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{salaryData.earnedSalary.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
            </div>

            {/* Bonus */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">إجمالي العلاوات</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">+{salaryData.bonus.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-650 flex items-center justify-center font-bold text-lg">
                📈
              </div>
            </div>

            {/* Normal Deductions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">خصومات عادية</p>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  -{(
                    salaryData.deduction -
                    salaryData.leaveDeduction -
                    salaryData.absenceDeduction
                  ).toFixed(2)}{" "}
                  ج.م
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center font-bold text-lg">
                📉
              </div>
            </div>

            {/* Leave Deductions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">خصومات إجازة</p>
                <p className="text-2xl font-black text-rose-600 mt-1">-{salaryData.leaveDeduction.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center font-bold text-lg">
                🌴
              </div>
            </div>

            {/* Absence Deductions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">خصومات غياب</p>
                <p className="text-2xl font-black text-rose-600 mt-1">-{salaryData.absenceDeduction.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center font-bold text-lg">
                ❌
              </div>
            </div>

            {/* Advances */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">إجمالي السلف</p>
                <p className="text-2xl font-black text-amber-600 mt-1">-{salaryData.advance.toFixed(2)} ج.م</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-650 flex items-center justify-center font-bold text-lg">
                💸
              </div>
            </div>

            {/* Net Salary (Highlight) */}
            <div className={`col-span-1 sm:col-span-2 lg:col-span-4 rounded-2xl border p-5 shadow-sm flex items-center justify-between transition ${salaryData.netSalary >= 0 ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"}`}>
              <div>
                <p className="text-xs font-bold opacity-80">الصافي النهائي المستحق الدفع</p>
                <p className="text-3xl font-black mt-1.5">{salaryData.netSalary.toFixed(2)} ج.م</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
                💰
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              تفاصيل العمليات المسجلة لشهر {month}/{year}
            </h2>

            {salaryData.transactions?.length === 0 ? (
              <p className="text-slate-400 text-center py-6 font-medium">لا توجد معاملات مسجلة لهذا الشهر.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 text-xs font-bold">
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">ملاحظات الإدارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salaryData.transactions.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 text-slate-500 font-mono">
                          {new Date(t.date).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="p-3">
                          {t.leave_day ? (
                            <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-bold">إجازة يوم</span>
                          ) : t.absence_day ? (
                            <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-bold">غياب يوم</span>
                          ) : t.type === "bonus" ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">علاوة</span>
                          ) : t.type === "deduction" ? (
                            <span className="text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-bold">خصم</span>
                          ) : t.type === "advance" ? (
                            <span className="text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-bold">سلفة</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-700">
                          {t.amount.toFixed(2)} ج.م
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{t.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-slate-500 text-lg font-medium">
            {isArchived
              ? "هذا الحساب مؤرشف، ولا يتم احتساب الرواتب للحسابات المؤرشفة."
              : "لا توجد بيانات مسجلة لهذا الشهر."}
          </p>
        </div>
      )}

      {/* Notice Box */}
      <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-xs leading-relaxed">
        <h2 className="font-black text-sm mb-1.5 text-amber-900">⚠️ تنبيه بشأن تشغيل النظام:</h2>
        <p className="mb-1 text-slate-500 font-medium">هذا النظام يمر بفترة اختبار حالية وقد تظهر بعض الاختلافات الحسابية.</p>
        <p className="font-semibold text-slate-700">إذا لاحظت أي مشكلة أو بيانات غير صحيحة، نرجو منك إعلام الإدارة مباشرة لمراجعتها وتصحيحه.</p>
      </div>
    </div>
  );
}
