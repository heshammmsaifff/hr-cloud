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

  // تحميل بيانات الموظف
  const fetchEmployee = async () => {
    const { data, error } = await supabase
      .from("employees")
      // ✅ أضفنا is_archived
      .select("id, name, job_title, hire_date, is_archived")
      .eq("id", id)
      .single();
    if (!error && data) {
      setEmployee(data);
      setHireDate(new Date(data.hire_date));
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const { isConfirmed } = await Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد أنك تريد حذف هذه المعاملة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذفها",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!isConfirmed) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) {
      Swal.fire("خطأ ❌", "حدث خطأ أثناء الحذف.", "error");
    } else {
      Swal.fire("تم ✅", "تم حذف المعاملة بنجاح.", "success");
      fetchTransactions();
    }
  };

  const handleEditTransaction = async (transaction) => {
    // ✅ نعرض نافذة تعديل فيها القيم الحالية
    const { value: formValues } = await Swal.fire({
      title: "تعديل المعاملة",
      html: `
      <label>النوع:</label>
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
      <input id="swal-amount" type="number" class="swal2-input" placeholder="المبلغ" value="${
        transaction.amount
      }">
      <input id="swal-note" type="text" class="swal2-input" placeholder="ملاحظات" value="${
        transaction.note || ""
      }">
      <input id="swal-date" type="date" class="swal2-input" value="${
        transaction.date
      }">
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "💾 حفظ التعديلات",
      cancelButtonText: "إلغاء",
      preConfirm: () => {
        const type = document.getElementById("swal-type").value;
        const amount = document.getElementById("swal-amount").value;
        const note = document.getElementById("swal-note").value;
        const date = document.getElementById("swal-date").value;

        if (!amount || !date) {
          Swal.showValidationMessage("الرجاء إدخال المبلغ والتاريخ");
          return false;
        }

        return { type, amount, note, date };
      },
    });

    if (!formValues) return;

    const { error } = await supabase
      .from("transactions")
      .update({
        type: formValues.type,
        amount: parseFloat(formValues.amount),
        note: formValues.note,
        date: formValues.date,
      })
      .eq("id", transaction.id);

    if (error) {
      Swal.fire("خطأ ❌", "حدث خطأ أثناء حفظ التعديلات.", "error");
    } else {
      Swal.fire("تم ✅", "تم تعديل المعاملة بنجاح.", "success");
      fetchTransactions();
    }
  };

  // جلب الراتب الأساسي
  const fetchBaseSalary = async () => {
    const { data } = await supabase
      .from("salary_history")
      .select("base_salary, created_at")
      .eq("employee_id", id)
      .lte("created_at", new Date(year, month, 0).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setBaseSalary(data.base_salary);
  };

  // جلب المعاملات
  const fetchTransactions = async () => {
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);
    if (hireDate && (lastOfMonth < hireDate || firstOfMonth > today)) {
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

  // 🟢 حساب الملخص
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === "bonus") acc.bonus += t.amount;
      if (t.type === "deduction") acc.deduction += t.amount;
      if (t.type === "advance") acc.advance += t.amount;
      if (t.leave_day) {
        const leaveDeduction = t.amount;
        if (leaveDeduction > 0) {
          acc.leaveDeduction += leaveDeduction;
          acc.deduction += leaveDeduction;
        }
      }
      if (t.absence_day) {
        const absenceDeduction = 500;
        acc.absenceDeduction += absenceDeduction;
        acc.deduction += absenceDeduction;
      }
      return acc;
    },
    {
      bonus: 0,
      deduction: 0,
      advance: 0,
      leaveDeduction: 0,
      absenceDeduction: 0,
    }
  );

  const WORKING_DAYS_PER_MONTH = 26;
  const dailySalary = baseSalary / WORKING_DAYS_PER_MONTH;

  // ✅ تعديل هنا: الموظف المؤرشف ميتأثرش بعدد الأيام
  const daysWorked = employee?.is_archived
    ? WORKING_DAYS_PER_MONTH
    : year === today.getFullYear() && month === today.getMonth() + 1
    ? Math.min(today.getDate(), WORKING_DAYS_PER_MONTH)
    : WORKING_DAYS_PER_MONTH;

  const earnedSalary = dailySalary * daysWorked;

  const netSalaryWithDays =
    earnedSalary + summary.bonus - summary.deduction - summary.advance;

  // إضافة معاملة عادية
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // خريطة ترجمة أنواع المعاملات
  const typeLabels = {
    bonus: "علاوة",
    deduction: "خصم",
    advance: "سلفة",
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const typeLabel = typeLabels[form.type] || form.type;
    const confirmationMessage =
      `هل أنت متأكد من إضافة المعاملة التالية؟\n\n` +
      `نوع المعاملة: ${typeLabel}\n` +
      `المبلغ: ${form.amount}\n` +
      `ملاحظة: ${form.note}`;
    const confirmed = window.confirm(confirmationMessage);
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
    } else {
      alert("حدث خطأ أثناء إضافة المعاملة.");
    }
    setLoading(false);
  };

  // إضافة إجازة أو غياب منفصلة
  const addLeaveOrAbsence = async (type) => {
    // 🗓️ نطلب من المستخدم يختار التاريخ
    const { value: selectedDate } = await Swal.fire({
      title: "اختيار التاريخ",
      input: "date",
      inputLabel: "اختر تاريخ اليوم المراد تسجيله",
      inputValue: new Date().toISOString().split("T")[0],
      showCancelButton: true,
      confirmButtonText: "تأكيد",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    });

    if (!selectedDate) {
      return Swal.fire("تم الإلغاء", "لم يتم اختيار أي تاريخ.", "info");
    }

    const isLeave = type === "leave";
    const { data: leaveDays } = await supabase
      .from("transactions")
      .select("id")
      .eq("employee_id", id)
      .eq("leave_day", true)
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte(
        "date",
        `${year}-${String(month).padStart(2, "0")}-${new Date(
          year,
          month,
          0
        ).getDate()}`
      );
    const leaveCount = leaveDays?.length || 0;

    const amountValue = isLeave ? (leaveCount < 4 ? 0 : baseSalary / 26) : 500;

    const confirmMessage = isLeave
      ? `هل أنت متأكد أنك تريد تسجيل إجازة يوم؟ ${
          leaveCount < 4
            ? "لن يتم خصم أي مبلغ لأنك لم تتجاوز 4 إجازات."
            : `سيتم خصم ${amountValue} جنيه من الراتب.`
        }`
      : `هل أنت متأكد أنك تريد تسجيل غياب يوم؟ سيتم خصم ${amountValue} جنيه من الراتب.`;

    const { isConfirmed } = await Swal.fire({
      title: "تأكيد العملية",
      text: confirmMessage,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، تأكيد",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!isConfirmed) return;

    setLoading(true);
    const { error } = await supabase.from("transactions").insert([
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
    if (!error) fetchTransactions();
    setLoading(false);
  };

  if (!employee) return <p className="p-6">⏳ جاري التحميل...</p>;
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;
  const showData = baseSalary > 0;

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

      {!showData && <p className="text-gray-500">لا توجد بيانات لهذا الشهر</p>}
      {showData && (
        <>
          <div className="bg-gray-50 p-3 rounded border mb-4">
            <p>
              💰 الراتب الأساسي:{" "}
              <span className="font-bold text-blue-700">
                {baseSalary.toFixed(2)} جنيه
              </span>
            </p>
            <p>
              💰 الأجر اليومي:{" "}
              <span className="font-bold text-blue-700">
                {dailySalary.toFixed(2)} جنيه
              </span>
            </p>
            {isCurrentMonth && (
              <p className="font-bold">
                الراتب حتى اليوم من بداية الشهر:{" "}
                <span className="text-green-900 font-extrabold text-2xl">
                  {earnedSalary.toFixed(2)} جنيه
                </span>
              </p>
            )}
          </div>

          {/* أزرار الغياب والإجازة منفصلة */}
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

          <h2 className="text-xl font-bold mb-2">سجل المعاملات للشهر</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 mb-4">
              لا توجد معاملات مسجلة لهذا الشهر
            </p>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border border-gray-200 text-right rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-blue-100 text-blue-800">
                    <th className="p-2 border">التاريخ</th>
                    <th className="p-2 border">النوع</th>
                    <th className="p-2 border">المبلغ</th>
                    <th className="p-2 border">ملاحظات</th>
                    <th className="p-2 border">التحكم</th>
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
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => handleEditTransaction(t)}
                          disabled={t.leave_day || t.absence_day}
                          className={`mx-2 ${
                            t.leave_day || t.absence_day
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 hover:underline"
                          }`}
                        >
                          ✏️ تعديل
                        </button>

                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-red-600 hover:underline mx-2"
                        >
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded border text-sm mb-4">
            <p>
              ✅ إجمالي العلاوات:{" "}
              <span className="font-bold text-green-600">
                {summary.bonus.toFixed(2)}
              </span>
            </p>
            <p>
              ❌ إجمالي الخصومات العادية:{" "}
              <span className="font-bold text-red-600">
                {(
                  summary.deduction -
                  summary.leaveDeduction -
                  summary.absenceDeduction
                ).toFixed(2)}
              </span>
            </p>
            <p>
              ❌ إجمالي خصومات الإجازة:{" "}
              <span className="font-bold text-red-600">
                {summary.leaveDeduction.toFixed(2)}
              </span>
            </p>
            <p>
              ❌ إجمالي خصومات الغياب:{" "}
              <span className="font-bold text-red-600">
                {summary.absenceDeduction.toFixed(2)}
              </span>
            </p>
            <p>
              💰 إجمالي السلف:{" "}
              <span className="font-bold text-yellow-600">
                {summary.advance.toFixed(2)}
              </span>
            </p>
            <hr className="my-2 border-gray-300" />
            <p>
              🔵 صافي الراتب بعد المعاملات:{" "}
              <span
                className={`font-bold ${
                  netSalaryWithDays >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {netSalaryWithDays.toFixed(2)}
              </span>
            </p>
          </div>

          {/* فورم المعاملات العادية */}
          {isCurrentMonth && (
            <form onSubmit={handleSave} className="space-y-4 mb-6">
              <h2 className="text-lg font-bold mb-2">إضافة معاملة جديدة</h2>
              <div>
                <label className="block mb-1 font-semibold">نوع المعاملة</label>
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
              </div>
              <div>
                <label className="block mb-1 font-semibold">المبلغ</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">ملاحظات</label>
                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">
                  تاريخ المعاملة
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full border rounded p-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "⏳ جاري الحفظ..." : "💾 حفظ"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
