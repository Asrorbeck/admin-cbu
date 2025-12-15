import { useState, useEffect } from "react";
import { getCorruptionReportsStatisticsApi } from "../utils/api";
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

const KorrupsiyaStatistikalar = () => {
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
    totalReports: 0,
    acceptedReports: 0,
    rejectedReports: 0,
    pendingReports: 0,
    anonymousReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [chartData, setChartData] = useState({
    dailyReports: [],
    reportStatus: [],
    reportComparison: [],
  });

  useEffect(() => {
    fetchStatistics();
    document.title = "Korrupsiya murojaatlari statistikasi - Markaziy Bank Administratsiyasi";
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch statistics from new API
      const statisticsData = await getCorruptionReportsStatisticsApi(dateRange.start, dateRange.end);
      
      // Update stats from API response
      setStats({
        totalReports: statisticsData.total_reports || 0,
        acceptedReports: statisticsData.accepted_reports || 0,
        rejectedReports: statisticsData.rejected_reports || 0,
        pendingReports: statisticsData.pending_reports || 0,
        anonymousReports: statisticsData.anonym_reports || 0,
      });

      // Prepare chart data from API response
      prepareChartDataFromAPI(statisticsData);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Statistikalarni yuklashda xatolik yuz berdi");
      // Set empty stats
      setStats({
        totalReports: 0,
        acceptedReports: 0,
        rejectedReports: 0,
        pendingReports: 0,
        anonymousReports: 0,
      });
      setChartData({
        dailyReports: [],
        reportStatus: [],
        reportComparison: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartDataFromAPI = (statisticsData) => {
    // Daily reports data from API
    const dailyReports = (statisticsData.daily_reports || []).map((day) => {
      const date = new Date(day.date);
      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
      const month = monthNames[date.getMonth()];
      const dayNum = date.getDate();
      return {
        date: `${dayNum} ${month}`,
        murojaatlar: day.count || 0,
      };
    });

    // Report status pie chart data
    const reportStatus = [
      { 
        name: "Qabul qilingan", 
        value: statisticsData.accepted_reports || 0, 
        color: "#10b981" 
      },
      { 
        name: "Rad etilgan", 
        value: statisticsData.rejected_reports || 0, 
        color: "#ef4444" 
      },
      { 
        name: "Kutilmoqda", 
        value: statisticsData.pending_reports || 0, 
        color: "#f59e0b" 
      },
    ];

    // Report comparison bar chart data
    const reportComparison = [
      { 
        name: "Murojaatlar", 
        jami: statisticsData.total_reports || 0, 
        qabul: statisticsData.accepted_reports || 0, 
        rad: statisticsData.rejected_reports || 0,
        kutilmoqda: statisticsData.pending_reports || 0
      },
    ];

    setChartData({
      dailyReports,
      reportStatus,
      reportComparison,
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
            Korrupsiya murojaatlari statistikasi
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Reports Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Jami murojaatlar</p>
              <p className="text-3xl font-bold mt-1">{stats.totalReports}</p>
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Accepted Reports Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Qabul qilingan</p>
              <p className="text-3xl font-bold mt-1">{stats.acceptedReports}</p>
              <p className="text-green-100 text-xs mt-2">
                Arxivlangan
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

        {/* Rejected Reports Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Rad etilgan</p>
              <p className="text-3xl font-bold mt-1">{stats.rejectedReports}</p>
              <p className="text-red-100 text-xs mt-2">
                Qabul qilinmagan
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

        {/* Pending Reports Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Kutilmoqda</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingReports}</p>
              <p className="text-yellow-100 text-xs mt-2">
                Ko'rib chiqilmoqda
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Anonymous Reports Card */}
        <div 
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Anonim sorovlar</p>
              <p className="text-3xl font-bold mt-1">{stats.anonymousReports}</p>
              <p className="text-purple-100 text-xs mt-2">
                Anonim murojaatlar
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reports Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kunlik murojaatlar soni
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.dailyReports}>
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
                dataKey="murojaatlar" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Murojaatlar"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Report Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Murojaatlar holati
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.reportStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.reportStatus.map((entry, index) => (
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

        {/* Report Comparison Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Murojaatlar taqqoslash
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.reportComparison}>
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
              <Bar dataKey="jami" fill="#3b82f6" name="Jami" />
              <Bar dataKey="qabul" fill="#10b981" name="Qabul qilingan" />
              <Bar dataKey="rad" fill="#ef4444" name="Rad etilgan" />
              <Bar dataKey="kutilmoqda" fill="#f59e0b" name="Kutilmoqda" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Statistics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Qo'shimcha statistika
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    O'rtacha kunlik murojaatlar
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {(() => {
                      if (chartData.dailyReports.length === 0) return 0;
                      const totalReports = chartData.dailyReports.reduce((sum, day) => sum + day.murojaatlar, 0);
                      const totalDays = chartData.dailyReports.length;
                      return (totalReports / totalDays).toFixed(1);
                    })()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {chartData.dailyReports.length > 0 && (
                      <>
                        {chartData.dailyReports.reduce((sum, day) => sum + day.murojaatlar, 0)} ta / {chartData.dailyReports.length} kun
                      </>
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                    Eng ko'p murojaatlar kun
                  </p>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {chartData.dailyReports.length > 0
                      ? (() => {
                          const maxDay = chartData.dailyReports.reduce((max, day) => 
                            day.murojaatlar > max.murojaatlar ? day : max
                          , chartData.dailyReports[0]);
                          return `${maxDay.murojaatlar} ta (${maxDay.date})`;
                        })()
                      : "Ma'lumot yo'q"}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                    Anonim murojaatlar
                  </p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                    {stats.anonymousReports}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    {stats.totalReports > 0
                      ? `${((stats.anonymousReports / stats.totalReports) * 100).toFixed(1)}% anonim`
                      : "0%"}
                  </p>
                </div>
                <div className="h-12 w-12 bg-indigo-200 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Qo'shimcha ma'lumotlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Qabul qilish foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalReports > 0
                ? ((stats.acceptedReports / stats.totalReports) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.acceptedReports} / {stats.totalReports} murojaat
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rad etish foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalReports > 0
                ? ((stats.rejectedReports / stats.totalReports) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.rejectedReports} / {stats.totalReports} murojaat
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kutilmoqda foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalReports > 0
                ? ((stats.pendingReports / stats.totalReports) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.pendingReports} / {stats.totalReports} murojaat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KorrupsiyaStatistikalar;

