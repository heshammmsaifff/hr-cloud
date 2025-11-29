"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import Swal from "sweetalert2";

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
        `${year}-${String(month).padStart(2, "0")}-${lastOfMonth.getDate()}`
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
  let daysWorked = WORKING_DAYS_PER_MONTH;
  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    daysWorked = today.getDate() - leaveDays;
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
      `هل أنت متأكد من إضافة المعاملة؟\nنوع: ${form.type}\nالمبلغ: ${form.amount}\nملاحظة: ${form.note}`
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
    const leaveCount = transactions.filter(
      (t) =>
        t.leave_day &&
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year
    ).length;
    const amountValue = isLeave
      ? leaveCount < 4
        ? 0
        : dailySalary
      : dailySalary;

    const { isConfirmed } = await Swal.fire({
      title: "تأكيد العملية",
      text: isLeave
        ? `تسجيل إجازة يوم${
            leaveCount < 4 ? " (بدون خصم)" : ` سيتم خصم ${amountValue} جنيه`
          }`
        : `تسجيل غياب يوم، سيتم خصم ${amountValue} جنيه`,
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
        note: isLeave
          ? leaveCount < 4
            ? "إجازة يوم (بدون خصم)"
            : "إجازة يوم (بخصم)"
          : "غياب يوم",
        date: selectedDate,
        leave_day: isLeave,
        absence_day: !isLeave,
      },
    ]);
    fetchTransactions();
    setLoading(false);
  };

  if (!employee) return <p className="p-6">⏳ جاري التحميل...</p>;

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        المعاملات المالية: {employee.name} ({employee.job_title})
      </h1>

      {/* اختيار الشهر والسنة */}
      <div className="flex gap-4 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded p-2 bg-white shadow-sm"
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
          className="border rounded p-2 bg-white shadow-sm"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* الملخص */}
      <div className="bg-gray-50 p-3 rounded border mb-4">
        <p>
          💰 الراتب الأساسي:{" "}
          <span className="font-bold text-blue-700">
            {baseSalary.toFixed(2)}
          </span>
        </p>
        <p>
          💰 الأجر اليومي:{" "}
          <span className="font-bold text-blue-700">
            {dailySalary.toFixed(2)}
          </span>
        </p>
        <p>
          💰 المستحق حتى الآن:{" "}
          <span className="font-bold text-green-700">
            {earnedSalary.toFixed(2)}
          </span>
        </p>
        <p>
          ✅ إجمالي العلاوات:{" "}
          <span className="font-bold text-green-600">{bonus.toFixed(2)}</span>
        </p>
        <p>
          ❌ إجمالي الخصومات:{" "}
          <span className="font-bold text-red-600">{deduction.toFixed(2)}</span>
        </p>
        <p>
          ❌ إجمالي خصومات إجازة:{" "}
          <span className="font-bold text-red-600">
            {leaveDeduction.toFixed(2)}
          </span>
        </p>
        <p>
          ❌ إجمالي خصومات غياب:{" "}
          <span className="font-bold text-red-600">
            {absenceDeduction.toFixed(2)}
          </span>
        </p>
        <p>
          💰 إجمالي السلف:{" "}
          <span className="font-bold text-yellow-600">
            {advance.toFixed(2)}
          </span>
        </p>
        <hr className="my-2 border-gray-300" />
        <p>
          🔵 صافي الراتب بعد المعاملات:{" "}
          <span
            className={`font-bold ${
              netSalary >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {netSalary.toFixed(2)}
          </span>
        </p>
      </div>

      {/* أزرار الغياب والإجازة */}
      {isCurrentMonth && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => addLeaveOrAbsence("leave")}
            disabled={loading}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            تسجيل إجازة يوم
          </button>
          <button
            onClick={() => addLeaveOrAbsence("absence")}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            تسجيل غياب يوم
          </button>
        </div>
      )}

      {/* جدول المعاملات */}
      {transactions.length === 0 ? (
        <p className="text-gray-500 mb-4">لا توجد معاملات مسجلة لهذا الشهر</p>
      ) : (
        <div className="overflow-x-auto mb-4">
          <table className="w-full border border-gray-200 text-right rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="p-2 border">التاريخ</th>
                <th className="p-2 border">النوع</th>
                <th className="p-2 border">المبلغ</th>
                <th className="p-2 border">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr
                  key={t.id}
                  className={
                    idx % 2 === 0
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-white hover:bg-gray-100"
                  }
                >
                  <td className="p-2 border">
                    {new Date(t.date).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-2 border">
                    {t.leave_day
                      ? "إجازة يوم"
                      : t.absence_day
                      ? "غياب يوم"
                      : t.type === "bonus"
                      ? "علاوة"
                      : t.type === "deduction"
                      ? "خصم"
                      : t.type === "advance"
                      ? "سلفة"
                      : "-"}
                  </td>
                  <td className="p-2 border">{t.amount.toFixed(2)}</td>
                  <td className="p-2 border">{t.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* فورم إضافة معاملة */}
      {isCurrentMonth && (
        <form onSubmit={handleSave} className="space-y-4 mb-6">
          <h2 className="text-lg font-bold mb-2">إضافة معاملة جديدة</h2>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="bonus">علاوة / إضافة</option>
            <option value="deduction">خصم</option>
            <option value="advance">سلفة</option>
          </select>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
            placeholder="المبلغ"
          />
          <input
            type="text"
            name="note"
            value={form.note}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="ملاحظات"
          />
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border rounded p-2"
            max={new Date().toISOString().split("T")[0]}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "⏳ جاري الحفظ..." : "💾 حفظ"}
          </button>
        </form>
      )}
    </div>
  );
}
