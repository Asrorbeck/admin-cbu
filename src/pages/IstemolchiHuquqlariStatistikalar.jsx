import { useState, useEffect } from "react";
import {
  getAppealsApi,
  getOrganizationsApi,
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

const IstemolchiHuquqlariStatistikalar = () => {
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
    totalAppeals: 0,
    acceptedAppeals: 0,
    rejectedAppeals: 0,
    anonymousAppeals: 0,
    pendingAppeals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [appeals, setAppeals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [chartData, setChartData] = useState({
    dailyAppeals: [],
    appealStatus: [],
    appealComparison: [],
    topSearchedOrganizations: [],
  });

  useEffect(() => {
    fetchStatistics();
    document.title = "Iste'molchi huquqlari statistikasi - Markaziy Bank Administratsiyasi";
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [appealsData, organizationsData] = await Promise.all([
        getAppealsApi(),
        getOrganizationsApi(),
      ]);

      // Ensure data is an array
      const appealsArray = Array.isArray(appealsData) 
        ? appealsData 
        : (appealsData?.data || []);
      const organizationsArray = Array.isArray(organizationsData) 
        ? organizationsData 
        : (organizationsData?.data || []);

      setAppeals(appealsArray);
      setOrganizations(organizationsArray);

      // Calculate statistics
      calculateStats(appealsArray, organizationsArray);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Statistikalarni yuklashda xatolik yuz berdi");
      // Set empty arrays on error
      setAppeals([]);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps, orgs) => {
    // Ensure apps and orgs are arrays
    const safeApps = Array.isArray(apps) ? apps : [];
    const safeOrgs = Array.isArray(orgs) ? orgs : [];
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of day

    // Filter appeals by date range
    const filteredApps = safeApps.filter((app) => {
      const appDate = new Date(app.created_at || app.date_created);
      return appDate >= startDate && appDate <= endDate;
    });

    // Count total appeals
    const totalAppeals = filteredApps.length;

    // Count by status
    const acceptedAppeals = filteredApps.filter(
      (app) => (app.status || "").toUpperCase() === "APPEAL_CLOSED_ACCEPTED"
    ).length;

    const rejectedAppeals = filteredApps.filter(
      (app) => (app.status || "").toUpperCase() === "APPEAL_CLOSED_REJECTED"
    ).length;

    const pendingAppeals = filteredApps.filter(
      (app) => {
        const status = (app.status || "").toUpperCase();
        return status === "NEW" || 
               status === "APPEAL_NEW" || 
               status === "APPEAL_PENDING" || 
               status === "APPEAL_IN_PROGRESS";
      }
    ).length;

    // Count anonymous appeals
    const anonymousAppeals = filteredApps.filter(
      (app) => app.is_anonymous === true
    ).length;

    setStats({
      totalAppeals,
      acceptedAppeals,
      rejectedAppeals,
      anonymousAppeals,
      pendingAppeals,
    });

    // Prepare chart data
    prepareChartData(filteredApps, orgs, startDate, endDate);
  };

  const prepareChartData = (apps, orgs, startDate, endDate) => {
    // Daily appeals data
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
        murojaatlar: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count appeals per day
    apps.forEach((app) => {
      const appDate = new Date(app.created_at || app.date_created);
      const dateKey = appDate.toISOString().split('T')[0];
      if (dailyDataMap.has(dateKey)) {
        dailyDataMap.get(dateKey).murojaatlar += 1;
      }
    });

    const dailyAppeals = Array.from(dailyDataMap.values());

    // Appeal status pie chart data
    const appealStatus = [
      { name: "Qabul qilingan", value: apps.filter(a => (a.status || "").toUpperCase() === "APPEAL_CLOSED_ACCEPTED").length, color: "#10b981" },
      { name: "Rad etilgan", value: apps.filter(a => (a.status || "").toUpperCase() === "APPEAL_CLOSED_REJECTED").length, color: "#ef4444" },
      { name: "Kutilmoqda", value: apps.filter(a => {
        const s = (a.status || "").toUpperCase();
        return s === "NEW" || s === "APPEAL_NEW" || s === "APPEAL_PENDING" || s === "APPEAL_IN_PROGRESS";
      }).length, color: "#f59e0b" },
    ];

    // Appeal comparison bar chart data
    const appealComparison = [
      { name: "Jami murojaatlar", jami: apps.length, qabul: 0, rad: 0 },
      { name: "Qabul qilingan", jami: 0, qabul: apps.filter(a => (a.status || "").toUpperCase() === "APPEAL_CLOSED_ACCEPTED").length, rad: 0 },
      { name: "Rad etilgan", jami: 0, qabul: 0, rad: apps.filter(a => (a.status || "").toUpperCase() === "APPEAL_CLOSED_REJECTED").length },
    ];

    // Top searched organizations
    // Extract organization names from appeals (subject, message, or any field that might contain org name)
    const orgSearchMap = new Map();
    
    apps.forEach((app) => {
      const text = `${app.subject || ""} ${app.message || ""}`.toLowerCase();
      
      // Check each organization
      safeOrgs.forEach((org) => {
        const orgName = (org.name || "").toLowerCase();
        const licenseNumber = (org.license_number || "").toLowerCase();
        const inn = (org.inn || "").toLowerCase();
        
        if (orgName && text.includes(orgName)) {
          orgSearchMap.set(org.id, (orgSearchMap.get(org.id) || 0) + 1);
        } else if (licenseNumber && text.includes(licenseNumber)) {
          orgSearchMap.set(org.id, (orgSearchMap.get(org.id) || 0) + 1);
        } else if (inn && text.includes(inn)) {
          orgSearchMap.set(org.id, (orgSearchMap.get(org.id) || 0) + 1);
        }
      });
    });

    // Convert to array and sort by count
    const topSearched = Array.from(orgSearchMap.entries())
      .map(([orgId, count]) => {
        const org = safeOrgs.find(o => o.id === orgId);
        return {
          name: org ? (org.name || `Litsenziya ${org.license_number || orgId}`) : `ID: ${orgId}`,
          qidiruvlar: count,
          license_number: org?.license_number || "-",
        };
      })
      .sort((a, b) => b.qidiruvlar - a.qidiruvlar)
      .slice(0, 10); // Top 10

    setChartData({
      dailyAppeals,
      appealStatus,
      appealComparison,
      topSearchedOrganizations: topSearched,
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
            Iste'molchi huquqlari statistikasi
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
        {/* Total Appeals Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Jami murojaatlar</p>
              <p className="text-3xl font-bold mt-1">{stats.totalAppeals}</p>
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

        {/* Accepted Appeals Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Qabul qilingan</p>
              <p className="text-3xl font-bold mt-1">{stats.acceptedAppeals}</p>
              <p className="text-green-100 text-xs mt-2">
                Qanoatlantirilgan
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

        {/* Rejected Appeals Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Rad etilgan</p>
              <p className="text-3xl font-bold mt-1">{stats.rejectedAppeals}</p>
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

        {/* Anonymous Appeals Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Anonim so'rovlar</p>
              <p className="text-3xl font-bold mt-1">{stats.anonymousAppeals}</p>
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Appeals Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Kutilmoqda</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingAppeals}</p>
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
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Appeals Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kunlik murojaatlar soni
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.dailyAppeals}>
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

        {/* Appeal Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Murojaatlar holati
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.appealStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.appealStatus.map((entry, index) => (
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

        {/* Appeal Comparison Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Murojaatlar taqqoslash
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.appealComparison}>
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
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Searched Organizations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Eng ko'p qidirilgan tashkilotlar
          </h3>
          {chartData.topSearchedOrganizations.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={chartData.topSearchedOrganizations}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                <XAxis 
                  type="number"
                  className="text-xs text-gray-600 dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  className="text-xs text-gray-600 dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                  width={150}
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
                <Bar dataKey="qidiruvlar" fill="#8b5cf6" name="Qidiruvlar soni" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ma'lumotlar topilmadi
              </p>
            </div>
          )}
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
              {stats.totalAppeals > 0
                ? ((stats.acceptedAppeals / stats.totalAppeals) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.acceptedAppeals} / {stats.totalAppeals} murojaat
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rad etish foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalAppeals > 0
                ? ((stats.rejectedAppeals / stats.totalAppeals) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.rejectedAppeals} / {stats.totalAppeals} murojaat
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Anonim so'rovlar foizi
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalAppeals > 0
                ? ((stats.anonymousAppeals / stats.totalAppeals) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.anonymousAppeals} / {stats.totalAppeals} murojaat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IstemolchiHuquqlariStatistikalar;

