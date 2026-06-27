export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-sans" dir="rtl">
      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-100/50 blur-[120px] opacity-60"></div>

      <div className="z-10 text-center px-4 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6 animate-pulse">
          <span>نظام الإدارة المالية للموظفين</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight mb-4 leading-tight">
          مرحباً بك في <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">سلطان جروب</span>
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          نظام متكامل وذكي لإدارة حضور وانصراف الموظفين، العمليات المالية، والرواتب الشهرية بكل دقة وسهولة.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Card 1: Employees Portal */}
          <a
            href="/employee/login"
            className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">دخول الموظفين</h2>
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              عرض الراتب الأساسي، مراجعة المعاملات المالية الشهرية، الإجازات، والغياب الخاصة بك.
            </p>
            <span className="mt-6 flex items-center gap-1 text-blue-600 text-sm font-bold group-hover:translate-x-[-4px] transition duration-300">
              دخول البوابة
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </a>

          {/* Card 2: Accountant Portal */}
          <a
            href="/admin/login"
            className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">دخول المحاسب</h2>
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              إدارة بيانات الموظفين، تعيين الرواتب، إضافة الخصومات والعلاوات والسلف الشهرية.
            </p>
            <span className="mt-6 flex items-center gap-1 text-purple-600 text-sm font-bold group-hover:translate-x-[-4px] transition duration-300">
              لوحة التحكم
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
