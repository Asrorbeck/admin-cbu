import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import VacanciesTable from "../components/tables/VacanciesTable";
import { getManagementByIdApi, getVacanciesApi } from "../utils/api";
import toast from "react-hot-toast";

const ManagementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [management, setManagement] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchManagementAndVacancies();
    document.title = "Boshqarma tafsilotlari - Markaziy Bank Administratsiyasi";
  }, [id]);

  const fetchManagementAndVacancies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch management data
      const managementData = await getManagementByIdApi(id);
      setManagement(managementData);

      // Try to fetch vacancies data filtered by management ID
      try {
        const vacanciesData = await getVacanciesApi(id);
        setVacancies(vacanciesData);
      } catch (vacancyError) {
        console.warn("Vacancies API not available:", vacancyError);
        // If vacancies API fails, just set empty array and continue
        setVacancies([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
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

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Xatolik yuz berdi
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchManagementAndVacancies}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (!management) {
    navigate("/departments");
    return null;
  }

  const handleEditVacancy = (vacancyItem) => {
    // TODO: Implement edit vacancy functionality
    toast.success(`Vakansiya "${vacancyItem.title}" tahrirlanadi`);
  };

  const handleDeleteVacancy = (vacancyId) => {
    setVacancies((prev) => prev.filter((item) => item.id !== vacancyId));
  };

  const handleViewVacancyDetails = (vacancyId) => {
    // TODO: Navigate to vacancy details page when created
    toast.success(`Vakansiya ID: ${vacancyId} tafsilotlari ko'rsatiladi`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Boshqarma: {management.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Boshqarma tafsilotlari va ma'lumotlari
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Edit Management Button */}
          <Link
            to={`/management/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Tahrirlash
          </Link>
        </div>
      </div>

      {/* Management Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* Management Name */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Boshqarma nomi:
            </h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {management.name}
            </p>
          </div>

          {/* Management Functions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Boshqarma vazifalari:
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {management.management_functions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Data Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vakansiyalar
          </h2>
          <div className="mt-2 sm:mt-0">
            <Link
              to={`/management/${id}/new-vacancy`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Yangi vakansiya qo'shish
            </Link>
          </div>
        </div>

        {vacancies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-12">
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Vakansiyalar yo'q
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Bu boshqarma uchun hozircha vakansiyalar mavjud emas.
              </p>
            </div>
          </div>
        ) : (
          <VacanciesTable
            vacancies={vacancies}
            managementId={id}
            onEdit={handleEditVacancy}
            onDelete={handleDeleteVacancy}
            onViewDetails={handleViewVacancyDetails}
          />
        )}
      </div>
    </div>
  );
};

export default ManagementDetails;
