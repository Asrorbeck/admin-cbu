import { useState, useEffect } from "react";
import QuickCreateVacancyModal from "../components/modals/QuickCreateVacancyModal";
import {
  getDepartmentsApi,
  getManagementApi,
  getVacanciesApi,
  getApplicationsApi,
} from "../utils/api";
import toast from "react-hot-toast";

const KadrlarDashboard = () => {
  const [stats, setStats] = useState({
    departments: 0,
    management: 0,
    vacancies: 0,
    applications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    document.title = "Departament - Markaziy Bank Administratsiyasi";
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [departments, management, vacancies, applications] =
        await Promise.all([
          getDepartmentsApi(),
          getManagementApi(),
          getVacanciesApi(),
          getApplicationsApi(),
        ]);

      // Handle paginated response format: { results: [...], count: ... }
      const departmentsArray = Array.isArray(departments) 
        ? departments 
        : (departments?.results || departments?.data || []);
      const managementArray = Array.isArray(management) 
        ? management 
        : (management?.results || management?.data || []);
      const vacanciesArray = Array.isArray(vacancies) 
        ? vacancies 
        : (vacancies?.results || vacancies?.data || []);
      const applicationsArray = Array.isArray(applications) 
        ? applications 
        : (applications?.results || applications?.data || []);

      setStats({
        departments: departmentsArray.length,
        management: managementArray.length,
        vacancies: vacanciesArray.length,
        applications: applicationsArray.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Statistikalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Departments Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Departamentlar</p>
              <p className="text-3xl font-bold">{stats.departments}</p>
              <p className="text-blue-100 text-xs mt-1">Faol departamentlar</p>
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Management Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Boshqarmalar</p>
              <p className="text-3xl font-bold">{stats.management}</p>
              <p className="text-blue-100 text-xs mt-1">Tashkilotlar</p>
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Vacancies Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Vakansiyalar</p>
              <p className="text-3xl font-bold">{stats.vacancies}</p>
              <p className="text-blue-100 text-xs mt-1">Ochiq pozitsiyalar</p>
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

        {/* Applications Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Arizalar</p>
              <p className="text-3xl font-bold">{stats.applications}</p>
              <p className="text-blue-100 text-xs mt-1">Kelib tushgan</p>
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
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            So'nggi faoliyat
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              So'nggi faoliyat yo'q
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tizimda hozircha faoliyatlar qayd etilmagan
            </p>
          </div>
        </div>
      </div>

      {/* Quick Create Vacancy Modal */}
      <QuickCreateVacancyModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={() => {
          setIsQuickCreateOpen(false);
          fetchStats(); // Refresh stats after creation
        }}
      />
    </div>
  );
};

export default KadrlarDashboard;
