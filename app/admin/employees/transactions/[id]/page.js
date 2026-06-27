"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import Swal from "sweetalert2";
import Link from "next/link";

export default function TransactionsPage() {
  const { id } = useParams();
  const today = new Date();

  const [employee, setEmployee] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [baseSalary, setBaseSalary] = useState(0);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "bonus",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [hireDate, setHireDate] = useState(null);
  const [isArchived, setIsArchived] = useState(false);
  const WORKING_DAYS_PER_MONTH = 26;

  // جلب بيانات الموظف
  const fetchEmployee = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, job_title, hire_date, is_archived, archive_date")
      .eq("id", id)
      .single();
    if (!error && data) {
      setEmployee(data);
      setHireDate(new Date(data.hire_date));
      setIsArchived(data.is_archived);
    }
  };

  const deleteTransaction = async (transactionId) => {
    const confirm = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف المعاملة نهائياً",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    await supabase.from("transactions").delete().eq("id", transactionId);
    await fetchTransactions();
    setLoading(false);

    Swal.fire("تم الحذف", "تم حذف المعاملة بنجاح", "success");
  };

  const editTransaction = async (transaction) => {
    if (transaction.leave_day || transaction.absence_day) {
      return Swal.fire(
        "غير مسموح",
        "لا يمكن تعديل الإجازة أو الغياب، مسموح بالحذف فقط",
        "error",
      );
    }

    const { value: formValues } = await Swal.fire({
      title: "تعديل المعاملة",
      html: `
      <select id="swal-type" class="swal2-input">
        <option value="bonus" ${
          transaction.type === "bonus" ? "selected" : ""
        }>علاوة</option>
        <option value="deduction" ${
          transaction.type === "deduction" ? "selected" : ""
        }>خصم</option>
        <option value="advance" ${
          transaction.type === "advance" ? "selected" : ""
        }>سلفة</option>
      </select>
      <input id="swal-amount" type="number" class="swal2-input" value="${
        transaction.amount
      }">
      <input id="swal-note" type="text" class="swal2-input" value="${
        transaction.note || ""
      }">
    `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          type: document.getElementById("swal-type").value,
          amount: parseFloat(document.getElementById("swal-amount").value),
          note: document.getElementById("swal-note").value,
        };
      },
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
    });

    if (!formValues) return;

    setLoading(true);

    await supabase
      .from("transactions")
      .update({
        type: formValues.type,
        amount: formValues.amount,
        note: formValues.note,
      })
      .eq("id", transaction.id);

    await fetchTransactions();
    setLoading(false);

    Swal.fire("تم التعديل", "تم تحديث المعاملة بنجاح", "success");
  };

  // جلب الراتب الأساسي
  const fetchBaseSalary = async () => {
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    const { data } = await supabase
      .from("salary_history")
      .select("base_salary, created_at")
      .eq("employee_id", id)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setBaseSalary(data.base_salary);
  };

  // جلب المعاملات
  const fetchTransactions = async () => {
    if (!hireDate) return;
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);

    if (lastOfMonth < hireDate || firstOfMonth > today) {
      setTransactions([]);
      setBaseSalary(0);
      return;
    }

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("employee_id", id)
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte(
        "date",
        `${year}-${String(month).padStart(2, "0")}-${lastOfMonth.getDate()}`,
      )
      .order("date", { ascending: false });
    setTransactions(data || []);
  };

  useEffect(() => {
    if (id) fetchEmployee();
  }, [id]);
  useEffect(() => {
    if (hireDate) {
      fetchBaseSalary();
      fetchTransactions();
    }
  }, [hireDate, month, year]);

  // 🟢 حسبة الملخص زي SalaryPage
  const dailySalary = baseSalary / WORKING_DAYS_PER_MONTH;

  let bonus = 0,
    deduction = 0,
    advance = 0,
    leaveDays = 0,
    leaveDeduction = 0,
    absenceDeduction = 0;

  transactions.forEach((t) => {
    const val = Number(t.amount) || 0;
    if (t.type === "bonus") bonus += val;
    if (t.type === "deduction") deduction += val;
    if (t.type === "advance") advance += val;
    if (t.leave_day) leaveDays += 1;
    if (t.absence_day) {
      absenceDeduction += dailySalary;
      deduction += dailySalary;
    }
  });

  const payableLeaveDays = leaveDays > 4 ? leaveDays - 4 : 0;
  leaveDeduction = payableLeaveDays * dailySalary;
  deduction += leaveDeduction;

  // الأيام المستحقة
  let daysWorked;

  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    // الشهر الحالي
    daysWorked = today.getDate() - leaveDays;
  } else {
    // أي شهر سابق
    const daysInMonth = new Date(year, month, 0).getDate();
    daysWorked = daysInMonth - leaveDays;
  }

  // لو الموظف مؤرشف
  if (isArchived) {
    const archiveDate = employee?.archive_date
      ? new Date(employee.archive_date)
      : null;
    if (archiveDate) {
      const selectedDate = new Date(year, month - 1, 1);
      if (
        selectedDate.getFullYear() === archiveDate.getFullYear() &&
        selectedDate.getMonth() === archiveDate.getMonth()
      ) {
        daysWorked = archiveDate.getDate();
      } else if (selectedDate > archiveDate) {
        daysWorked = 0;
      }
    }
  }

  const earnedSalary = dailySalary * daysWorked;
  const netSalary = earnedSalary + bonus - deduction - advance;

  // الفورم
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    const confirmed = window.confirm(
      `هل أنت متأكد من إضافة المعاملة؟\nنوع: ${form.type}\nالمبلغ: ${form.amount}\nملاحظة: ${form.note}`,
    );
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase.from("transactions").insert([
      {
        employee_id: id,
        type: form.type,
        amount: parseFloat(form.amount),
        note: form.note,
        date: form.date,
        leave_day: false,
        absence_day: false,
      },
    ]);

    if (!error) {
      setForm({
        type: "bonus",
        amount: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchTransactions();
    } else alert("حدث خطأ أثناء إضافة المعاملة.");
    setLoading(false);
  };

  // إضافة إجازة أو غياب
  const addLeaveOrAbsence = async (type) => {
    const { value: selectedDate } = await Swal.fire({
      title: "اختر التاريخ",
      input: "date",
      inputValue: new Date().toISOString().split("T")[0],
      showCancelButton: true,
      confirmButtonText: "تأكيد",
      cancelButtonText: "إلغاء",
    });
    if (!selectedDate) return;

    const isLeave = type === "leave";

    // عدد أيام الإجازة في الشهر
    const leaveCount = transactions.filter(
      (t) =>
        t.leave_day &&
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year,
    ).length;

    // ❌ منع الإجازة الخامسة
    if (isLeave && leaveCount >= 4) {
      await Swal.fire({
        icon: "warning",
        title: "تم استهلاك الإجازات",
        text: "تم استهلاك 4 أيام إجازة، برجاء تسجيل غياب يوم",
        confirmButtonText: "حسنًا",
      });
      return;
    }

    // المبلغ (الإجازة بدون خصم – الغياب بخصم يوم)
    const amountValue = isLeave ? 0 : dailySalary;

    const { isConfirmed } = await Swal.fire({
      title: "تأكيد العملية",
      text: isLeave
        ? "تسجيل إجازة يوم (بدون خصم)"
        : `تسجيل غياب يوم، سيتم خصم ${dailySalary} جنيه`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، تأكيد",
      cancelButtonText: "إلغاء",
    });
    if (!isConfirmed) return;

    setLoading(true);

    await supabase.from("transactions").insert([
      {
        employee_id: id,
        type: null,
        amount: amountValue,
        note: isLeave ? "إجازة يوم" : "غياب يوم",
        date: selectedDate,
        leave_day: isLeave,
        absence_day: !isLeave,
      },
    ]);

    fetchTransactions();
    setLoading(false);
  };

  if (!employee) return <p className="p-6">⏳ جاري التحميل...</p>;

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // هل المستخدم واقف على الشهر السابق؟
  const isPreviousMonth =
    (year === currentYear && month === currentMonth - 1) ||
    (currentMonth === 1 && year === currentYear - 1 && month === 12);

  // صلاحية إضافة معاملات للشهر السابق خلال أول 3 أيام فقط
  const isPreviousMonthAllowed = isPreviousMonth && today.getDate() <= 3;

  // صلاحية الشهر الحالي (نفس الشروط القديمة)
  const isCurrentMonth = year === currentYear && month === currentMonth;

  // الشرط النهائي لظهور الفورم
  const canAddTransactions = isCurrentMonth || isPreviousMonthAllowed;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen font-sans" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800">المعاملات المالية 💸</h1>
          <p className="text-slate-500 mt-1">
            إدارة مستحقات الموظف: <span className="font-bold text-blue-600">{employee.name}</span> ({employee.job_title})
            {isArchived && <span className="mr-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">حساب مؤرشف</span>}
          </p>
        </div>
        <Link
          href="/admin/employees"
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
          العودة لقائمة الموظفين
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Base Salary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">الراتب الأساسي</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{baseSalary.toFixed(2)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-lg">
            💵
          </div>
        </div>

        {/* Daily Rate */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">الأجر اليومي (26 يوم)</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{dailySalary.toFixed(2)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-lg">
            📅
          </div>
        </div>

        {/* Earned Salary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">المستحق الفعلي ({daysWorked} يوم عمل)</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{earnedSalary.toFixed(2)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center font-bold text-lg">
            ✓
          </div>
        </div>

        {/* Total Bonus */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي العلاوات</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">+{bonus.toFixed(2)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-650 flex items-center justify-center font-bold text-lg">
            📈
          </div>
        </div>

        {/* Normal & Leave & Absence Deductions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي الخصومات</p>
            <p className="text-2xl font-black text-rose-600 mt-1">-{deduction.toFixed(2)} ج.م</p>
            <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
              <span>إجازات: {leaveDeduction.toFixed(0)}</span>
              <span>غياب: {absenceDeduction.toFixed(0)}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center font-bold text-lg">
            📉
          </div>
        </div>

        {/* Advances */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي السلف</p>
            <p className="text-2xl font-black text-amber-600 mt-1">-{advance.toFixed(2)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-650 flex items-center justify-center font-bold text-lg">
            💸
          </div>
        </div>

        {/* Net Salary (Highlight) */}
        <div className={`col-span-1 sm:col-span-2 rounded-2xl border p-5 shadow-sm flex items-center justify-between transition ${netSalary >= 0 ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"}`}>
          <div>
            <p className="text-xs font-bold opacity-80">صافي الراتب بعد المعاملات</p>
            <p className="text-3xl font-black mt-1.5">{netSalary.toFixed(2)} ج.م</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
            💰
          </div>
        </div>
      </div>

      {/* Attendance & Leave Quick Actions */}
      {canAddTransactions && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <span className="text-sm font-bold text-slate-700">التسجيل السريع للحضور والغياب:</span>
          <div className="flex gap-3">
            <button
              onClick={() => addLeaveOrAbsence("leave")}
              disabled={loading}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-5 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              🌴 تسجيل إجازة يوم
            </button>
            <button
              onClick={() => addLeaveOrAbsence("absence")}
              disabled={loading}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-5 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              ❌ تسجيل غياب يوم
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Transactions list & Add Transaction form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transactions Table (Left Col) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            سجل المعاملات لهذا الشهر ({month}/{year})
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">
              لا توجد معاملات مسجلة للموظف في هذا الشهر.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 text-xs font-bold">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">ملاحظات</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transactions.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 text-slate-500 font-mono">
                        {new Date(t.date).toLocaleDateString("en-GB")}
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
                      <td className="p-3 text-slate-600 font-medium">
                        {t.note || "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          {!t.leave_day && !t.absence_day && (
                            <button
                              onClick={() => editTransaction(t)}
                              className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 rounded-lg font-bold transition text-[10px]"
                            >
                              ✏️ تعديل
                            </button>
                          )}
                          <button
                            onClick={() => deleteTransaction(t.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg font-bold transition text-[10px]"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Transaction form (Right Col) */}
        {canAddTransactions && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              إضافة معاملة جديدة
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع المعاملة</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="bonus">علاوة / إضافة 📈</option>
                  <option value="deduction">خصم 📉</option>
                  <option value="advance">سلفة 💸</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">المبلغ (جنيه)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  placeholder="أدخل المبلغ"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ملاحظات / سبب المعاملة</label>
                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="أدخل الملاحظات هنا"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">التاريخ</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50"
              >
                {loading ? "جاري الإضافة..." : "حفظ المعاملة المالية"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
