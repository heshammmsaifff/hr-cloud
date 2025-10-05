"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

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
      .select("is_active, hire_date, archived, archive_date")
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
    let daysWorked = 30;
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
      daysWorked = today.getDate();
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">الراتب الشهري</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded p-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded p-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {salaryData ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <p className="text-gray-700">
              الراتب الأساسي:{" "}
              <span className="font-semibold">
                {salaryData.baseSalary.toFixed(2)} جنيه
              </span>
            </p>
            <p className="text-gray-700">
              الأجر اليومي:{" "}
              <span className="font-semibold">
                {salaryData.dailyRate.toFixed(2)} جنيه
              </span>
            </p>
            <p className="text-gray-700">
              المستحق حتى الآن:{" "}
              <span className="font-semibold">
                {salaryData.earnedSalary.toFixed(2)} جنيه
              </span>
            </p>
            <p className="text-green-600">
              إضافات:{" "}
              <span className="font-semibold">
                {salaryData.bonus.toFixed(2)} جنيه
              </span>
            </p>
            <p className="text-red-600">
              خصومات عادية:{" "}
              <span className="font-semibold">
                {(
                  salaryData.deduction -
                  salaryData.leaveDeduction -
                  salaryData.absenceDeduction
                ).toFixed(2)}{" "}
                جنيه
              </span>
            </p>
            <p className="text-red-600">
              خصومات إجازة:{" "}
              <span className="font-semibold">
                {salaryData.leaveDeduction.toFixed(2)} جنيه
              </span>
            </p>
            <p className="text-red-600">
              خصومات غياب:{" "}
              <span className="font-semibold">
                {salaryData.absenceDeduction.toFixed(2)} جنيه
              </span>
            </p>
            <p className="text-orange-500">
              سلف:{" "}
              <span className="font-semibold">
                {salaryData.advance.toFixed(2)} جنيه
              </span>
            </p>
            <hr className="my-2 border-gray-300" />
            <p className="font-bold text-lg text-blue-700">
              الصافي: {salaryData.netSalary.toFixed(2)} جنيه
            </p>
          </div>

          {salaryData.transactions?.length === 0 ? (
            <p className="text-gray-500">لا توجد معاملات لهذا الشهر</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse shadow-md rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-blue-100 text-blue-800">
                    <th className="p-3 border-b">التاريخ</th>
                    <th className="p-3 border-b">النوع</th>
                    <th className="p-3 border-b">المبلغ</th>
                    <th className="p-3 border-b">ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryData.transactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={
                        idx % 2 === 0
                          ? "bg-gray-50 hover:bg-gray-100"
                          : "bg-white hover:bg-gray-100"
                      }
                    >
                      <td className="p-2 border-b">
                        {new Date(t.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-2 border-b">
                        {translateType(t.type, t.leave_day, t.absence_day)}
                      </td>
                      <td className="p-2 border-b">{t.amount.toFixed(2)}</td>
                      <td className="p-2 border-b">{t.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">
          {isArchived
            ? "هذا الموظف مؤرشف ولا يتم احتساب راتبه بعد تاريخ الأرشفة"
            : "لا توجد بيانات لهذا الشهر"}
        </p>
      )}
    </div>
  );
}
