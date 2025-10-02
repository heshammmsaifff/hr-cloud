export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl  font-bold mb-6">نظام إدارة الموظفين</h1>

      <div className="flex gap-4">
        <a
          href="/employee/login"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600"
        >
          دخول الموظفين
        </a>
        <a
          href="/admin/login"
          className="bg-green-500 text-white px-6 py-3 rounded-lg shadow hover:bg-green-600"
        >
          دخول المحاسب
        </a>
      </div>
    </main>
  );
}
