import { useState, useEffect } from "react";
import {
  getApplicationsApi,
  getVacanciesApi,
} from "../utils/api";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const KadrlarStatistikalar = () => {
  // Get date range defaults (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const [stats, setStats] = useState({
    applicationsCount: 0,
    testsTakenCount: 0,
    testsPassedCount: 0,
    totalVacancies: 0,
    activeVacancies: 0,
    inactiveVacancies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [chartData, setChartData] = useState({
    dailyApplications: [],
    testResults: [],
    vacancyStatus: [],
    testComparison: [],
  });

  useEffect(() => {
    fetchStatistics();
    document.title = "Kadrlar statistikasi - Markaziy Bank Administratsiyasi";
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [applicationsData, vacanciesData] = await Promise.all([
        getApplicationsApi(),
        getVacanciesApi(),
      ]);

      setApplications(applicationsData || []);
      setVacancies(vacanciesData || []);

      // Calculate statistics
      calculateStats(applicationsData || [], vacanciesData || []);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Statistikalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps, vacs) => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of day

    // Filter applications by date range
    const filteredApps = apps.filter((app) => {
      const appDate = new Date(app.created_at || app.date_created);
      return appDate >= startDate && appDate <= endDate;
    });

    // Count applications
    const applicationsCount = filteredApps.length;

    // Count tests taken (applications with test_scheduled status or test_date)
    const testsTaken = filteredApps.filter(
      (app) =>
        app.status === "test_scheduled" ||
        app.status === "TEST_SCHEDULED" ||
        app.test_date ||
        app.test_scheduled_at
    ).length;

    // Count tests passed (applications that passed test - we'll check status or test_passed field)
    // For now, we'll assume applications with test_scheduled status that have test results
    // In a real scenario, you'd check test results API
    const testsPassed = filteredApps.filter((app) => {
      // Check if application has passed test status or test_passed field
      return (
        app.test_passed === true ||
        app.test_status === "passed" ||
        (app.test_score && app.test_percentage >= 70) // Assuming 70% is passing
      );
    }).length;

    const testsFailed = testsTaken - testsPassed;

    // Vacancy statistics (not filtered by date as they're current state)
    const totalVacancies = vacs.length;
    const activeVacancies = vacs.filter(
      (vac) => vac.is_active !== false && vac.status !== "closed"
    ).length;
    const inactiveVacancies = totalVacancies - activeVacancies;

    setStats({
      applicationsCount,
      testsTakenCount: testsTaken,
      testsPassedCount: testsPassed,
      totalVacancies,
      activeVacancies,
      inactiveVacancies,
    });

    // Prepare chart data
    prepareChartData(filteredApps, vacs, startDate, endDate, testsPassed, testsFailed);
  };

  const prepareChartData = (apps, vacs, startDate, endDate, testsPassed, testsFailed) => {
    // Daily applications data
    const dailyDataMap = new Map();
    const currentDate = new Date(startDate);
    
    // Initialize all dates in range with 0
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
      const month = monthNames[currentDate.getMonth()];
      const day = currentDate.getDate();
      dailyDataMap.set(dateKey, {
        date: `${day} ${month}`,
        applications: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count applications per day
    apps.forEach((app) => {
      const appDate = new Date(app.created_at || app.date_created);
      const dateKey = appDate.toISOString().split('T')[0];
      if (dailyDataMap.has(dateKey)) {
        dailyDataMap.get(dateKey).applications += 1;
      }
    });

    const dailyApplications = Array.from(dailyDataMap.values());

    // Test results pie chart data
    const testResults = [
      { name: "O'tgan", value: testsPassed, color: "#10b981" },
      { name: "O'tmagan", value: testsFailed, color: "#ef4444" },
    ];

    // Vacancy status pie chart data
    const vacancyStatus = [
      { name: "Faol", value: vacs.filter(v => v.is_active !== false && v.status !== "closed").length, color: "#14b8a6" },
      { name: "Faol emas", value: vacs.filter(v => v.is_active === false || v.status === "closed").length, color: "#6b7280" },
    ];

    // Test comparison bar chart data
    const testComparison = [
      { name: "Arizalar", arizalar: apps.length, test: 0 },
      { name: "Test topshirganlar", arizalar: 0, test: apps.filter(a => a.status === "test_scheduled" || a.status === "TEST_SCHEDULED" || a.test_date || a.test_scheduled_at).length },
      { name: "Testdan o'tganlar", arizalar: 0, test: testsPassed },
    ];

    setChartData({
      dailyApplications,
      testResults,
      vacancyStatus,
      testComparison,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const monthNames = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-600 dark:text-gray-400">
            Yuklanmoqda...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kadrlar bo'limi statistikasi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Ma'lum muddat oralig'idagi statistika ma'lumotlari
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sana oralig'ini tanlang
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Boshlanish sanasi
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tugash sanasi
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Tanlangan oralik: {formatDate(dateRange.start)} — {formatDate(dateRange.end)}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Applications Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Arizalar soni</p>
              <p className="text-3xl font-bold mt-1">{stats.applicationsCount}</p>
              <p className="text-blue-100 text-xs mt-2">
                Tanlangan oralikda
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Tests Taken Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Test topshirganlar</p>
              <p className="text-3xl font-bold mt-1">{stats.testsTakenCount}</p>
              <p className="text-green-100 text-xs mt-2">
                Testdan o'tganlar soni
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Tests Passed Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Testdan o'tganlar</p>
              <p className="text-3xl font-bold mt-1">{stats.testsPassedCount}</p>
              <p className="text-emerald-100 text-xs mt-2">
                Muvaffaqiyatli o'tganlar
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Vacancies Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Jami vakansiyalar</p>
              <p className="text-3xl font-bold mt-1">{stats.totalVacancies}</p>
              <p className="text-purple-100 text-xs mt-2">
                Barcha vakansiyalar
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Vacancies Card */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Faol vakansiyalar</p>
              <p className="text-3xl font-bold mt-1">{stats.activeVacancies}</p>
              <p className="text-teal-100 text-xs mt-2">
                Hozirgi vaqtda faol
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Inactive Vacancies Card */}
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Faol bo'lmagan vakansiyalar</p>
              <p className="text-3xl font-bold mt-1">{stats.inactiveVacancies}</p>
              <p className="text-gray-100 text-xs mt-2">
                Yopilgan yoki nofaol
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Applications Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kunlik arizalar soni
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.dailyApplications}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="date" 
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827',
                }}
                className="dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
              />
              <Legend 
                wrapperStyle={{ color: 'inherit' }}
              />
              <Line 
                type="monotone" 
                dataKey="applications" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Arizalar"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Test Results Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test natijalari
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.testResults}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.testResults.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827',
                }}
                className="dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
              />
              <Legend 
                wrapperStyle={{ color: 'inherit' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vacancy Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vakansiyalar holati
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.vacancyStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.vacancyStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827',
                }}
                className="dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
              />
              <Legend 
                wrapperStyle={{ color: 'inherit' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Test Comparison Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Arizalar va test natijalari taqqoslash
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.testComparison}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="name" 
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827',
                }}
                className="dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
              />
              <Legend 
                wrapperStyle={{ color: 'inherit' }}
              />
              <Bar dataKey="arizalar" fill="#3b82f6" name="Arizalar" />
              <Bar dataKey="test" fill="#10b981" name="Test" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Qo'shimcha ma'lumotlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test topshirish foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.applicationsCount > 0
                ? ((stats.testsTakenCount / stats.applicationsCount) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.testsTakenCount} / {stats.applicationsCount} ariza
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Testdan o'tish foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.testsTakenCount > 0
                ? ((stats.testsPassedCount / stats.testsTakenCount) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.testsPassedCount} / {stats.testsTakenCount} test
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Faol vakansiyalar foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalVacancies > 0
                ? ((stats.activeVacancies / stats.totalVacancies) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.activeVacancies} / {stats.totalVacancies} vakansiya
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Umumiy muvaffaqiyat foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.applicationsCount > 0
                ? ((stats.testsPassedCount / stats.applicationsCount) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Arizadan testdan o'tishgacha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KadrlarStatistikalar;

