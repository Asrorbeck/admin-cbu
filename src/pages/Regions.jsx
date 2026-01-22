import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRegionsApi } from "../utils/api";
import toast from "react-hot-toast";

// Regions data with display names
const REGIONS = [
  { value: "toshkent shahar", label: "Toshkent shahar" },
  { value: "toshkent_viloyati", label: "Toshkent viloyati" },
  { value: "qashqadaryo", label: "Qashqadaryo" },
  { value: "samarqand", label: "Samarqand" },
  { value: "navoiy", label: "Navoiy" },
  { value: "andijon", label: "Andijon" },
  { value: "fargona", label: "Farg'ona" },
  { value: "namangan", label: "Namangan" },
  { value: "surxondaryo", label: "Surxondaryo" },
  { value: "sirdaryo", label: "Sirdaryo" },
  { value: "jizzax", label: "Jizzax" },
  { value: "buxoro", label: "Buxoro" },
  { value: "xorazm", label: "Xorazm" },
  { value: "qoraqalpogiston", label: "Qoraqalpog'iston Respublikasi" },
];

const Regions = () => {
  const navigate = useNavigate();
  const [regionsData, setRegionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Hududiy Bosh Boshqarmalar - Markaziy Bank Administratsiyasi";
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRegionsApi();
      console.log("Regions API response:", data);
      
      if (Array.isArray(data)) {
        setRegionsData(data);
      } else {
        console.warn("Unexpected regions response format:", data);
        setRegionsData([]);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      setError(error.message);
      toast.error("Hududlarni yuklashda xatolik yuz berdi");
      setRegionsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionClick = (regionCode) => {
    navigate(`/region/${regionCode}`);
  };

  // Get region label by region_code
  const getRegionLabel = (regionCode) => {
    const region = REGIONS.find((r) => r.value === regionCode);
    return region ? region.label : null;
  };

  // Loading state
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

  // Error state
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
          onClick={fetchRegions}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hududiy Bosh Boshqarmalar
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Hududiy boshqarmalar bo'yicha vakansiyalarni ko'rish
          </p>
        </div>
      </div>

      {/* Regions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  T/r
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hudud nomi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Faol vakansiyalar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nofaol vakansiyalar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Muddati o'tgan faol vakansiya
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {regionsData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Hududlar topilmadi
                  </td>
                </tr>
              ) : (
                regionsData.map((region, index) => (
                  <tr
                    key={region.region_code}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleRegionClick(region.region_code)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getRegionLabel(region.region_code) || region.region_name_uz || region.region_code || "Noma'lum"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {region.active_vacancies_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {region.inactive_vacancies_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          region.expired_active_vacancies_count > 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {region.expired_active_vacancies_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegionClick(region.region_code);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Vakansiyalarni ko'rish"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Regions;

