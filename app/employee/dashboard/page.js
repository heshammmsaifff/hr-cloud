"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const emp = localStorage.getItem("employee");
    if (!emp) {
      router.push("/employee/login");
    } else {
      setEmployee(JSON.parse(emp));
    }
  }, [router]);

  // جلب الراتب الحالي
  useEffect(() => {
    if (employee) {
      const fetchSalary = async () => {
        const today = new Date();
        const { data, error } = await supabase
          .from("salary_history")
          .select("base_salary")
          .eq("employee_id", employee.id)
          .lte("start_date", today.toISOString().split("T")[0])
          .or(
            `end_date.is.null,end_date.gte.${today.toISOString().split("T")[0]}`
          )
          .order("start_date", { ascending: false })
          .limit(1);

        if (!error && data.length > 0) {
          setSalary(data[0].base_salary);
        }
      };
      fetchSalary();
    }
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
      <p className="mb-2">
        <strong>الراتب الأساسي الحالي:</strong>{" "}
        {salary ? `${salary} جنيه` : "جارٍ التحميل..."}
      </p>
      <Link
        href="/employee/dashboard/salary"
        className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
      >
        عرض الراتب
      </Link>
    </div>
  );
}
