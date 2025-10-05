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

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4">مرحبًا {employee.name} 👋</h1>
      <p className="mb-2">
        <strong>اسم المستخدم:</strong> {employee.username}
      </p>
      <p className="mb-2">
        <strong>الوظيفة:</strong> {employee.job_title}
      </p>

      {/* حالة المؤرشف */}
      {isArchived ? (
        <div className="p-3 rounded border bg-yellow-50 text-sm text-yellow-800">
          هذا الحساب مؤرشف — لا يتم تحديث الراتب بعد تاريخ الأرشفة.
        </div>
      ) : (
        <p className="mb-2">
          <strong>الراتب الأساسي الحالي:</strong>{" "}
          {loadingSalary
            ? "جارٍ التحميل..."
            : salary !== null
            ? `${salary} جنيه`
            : "لم يتم تحديد راتب بعد"}
        </p>
      )}

      <Link
        href="/employee/dashboard/salary"
        className={`inline-block mt-4 px-4 py-2 rounded-lg shadow ${
          isArchived
            ? "bg-gray-300 text-gray-700 pointer-events-none"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        عرض الراتب
      </Link>
    </div>
  );
}
