import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    document.title = "Hududiy Bosh Boshqarmalar - Markaziy Bank Administratsiyasi";
  }, []);

  const handleRegionClick = (regionValue) => {
    navigate(`/region/${regionValue}`);
  };

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
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {REGIONS.map((region, index) => (
                <tr
                  key={region.value}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleRegionClick(region.value)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {region.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegionClick(region.value);
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Regions;

