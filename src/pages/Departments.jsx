import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DepartmentsTable from "../components/tables/DepartmentsTable";
import QuickCreateVacancyModal from "../components/modals/QuickCreateVacancyModal";
import {
  getDepartmentsApi,
  deleteDepartmentApi,
  updateDepartmentApi,
} from "../utils/api";
import toast from "react-hot-toast";

const Departments = () => {
  const [departmentsData, setDepartmentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  // Fetch departments from API
  useEffect(() => {
    fetchDepartments();
    document.title = "Departamentlar - Markaziy Bank Administratsiyasi";
  }, [page, pageSize]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartmentsApi({
        page: page,
        page_size: pageSize,
      });
      console.log("Departments API response:", data);

      // Handle paginated response format: { count, next, previous, results: [...] }
      let departmentsArray = [];
      if (Array.isArray(data)) {
        departmentsArray = data;
        setPaginationInfo({
          count: data.length,
          next: null,
          previous: null,
        });
      } else if (data && Array.isArray(data.results)) {
        // Paginated response format
        departmentsArray = data.results;
        setPaginationInfo({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
        });
      } else if (data && Array.isArray(data.data)) {
        // Wrapped response format: { data: [...] }
        departmentsArray = data.data;
        setPaginationInfo({
          count: data.data.length,
          next: null,
          previous: null,
        });
      } else {
        console.warn("Unexpected departments response format:", data);
        departmentsArray = [];
        setPaginationInfo({
          count: 0,
          next: null,
          previous: null,
        });
      }

      console.log("Processed departments array:", departmentsArray);
      setDepartmentsData(departmentsArray);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError(error.message);
      toast.error("Departamentlarni yuklashda xatolik yuz berdi");
      setDepartmentsData([]);
      setPaginationInfo({
        count: 0,
        next: null,
        previous: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (updatedData) => {
    const payload = {
      name_uz: updatedData.name_uz || "",
      name_cr: updatedData.name_cr || "",
      name_ru: updatedData.name_ru || "",
      department_tasks_uz: (updatedData.department_tasks_uz || []).filter(
        (t) => (t.task || "").trim() !== ""
      ),
      department_tasks_cr: (updatedData.department_tasks_cr || []).filter(
        (t) => (t.task || "").trim() !== ""
      ),
      department_tasks_ru: (updatedData.department_tasks_ru || []).filter(
        (t) => (t.task || "").trim() !== ""
      ),
    };

    try {
      await toast.promise(updateDepartmentApi(updatedData.id, payload), {
        loading: "Yangilanmoqda...",
        success: "Departament muvaffaqiyatli yangilandi",
        error: (err) =>
          err?.message || "Departamentni yangilashda xatolik yuz berdi",
      });

      setDepartmentsData((prev) =>
        prev.map((dept) =>
          dept.id === updatedData.id ? { ...dept, ...payload } : dept
        )
      );
    } catch (error) {
      console.error("Error updating department:", error);
      throw error; // allow child to keep modal open
    }
  };

  const handleDelete = async (departmentId) => {
    const tId = toast.loading("O'chirilmoqda...");
    try {
      await deleteDepartmentApi(departmentId);
      // Refresh the list after deletion
      await fetchDepartments();
      toast.success("Departament muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error(
        error.message || "Departamentni o'chirishda xatolik yuz berdi"
      );
    } finally {
      toast.dismiss(tId);
    }
  };

  const handleViewDetails = (departmentId) => {
    // Navigation will be handled by React Router
    window.location.href = `/departments/${departmentId}`;
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
          onClick={fetchDepartments}
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
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Departamentlar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Tashkilot departamentlarini boshqaring
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Quick Create Vacancy Button */}
          <button
            onClick={() => setIsQuickCreateOpen(true)}
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Tezkor vakansiya yaratish
          </button>
          {/* Add Department Button */}
          <Link
            to="/departments/new"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Yangi departament qo'shish
          </Link>
        </div>
      </div>

      {/* Filters Row: Page Size */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Sahifa hajmi:
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setPageSize(size);
              setPage(1);
            }}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            {[5, 10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {!Array.isArray(departmentsData) || departmentsData.length === 0 ? (
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Departamentlar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Birinchi departamentni qo'shish uchun tugmani bosing.
          </p>
        </div>
      ) : (
        <>
          <DepartmentsTable
            departments={departmentsData}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />

          {/* Pagination controls */}
          {(() => {
            const totalItems = paginationInfo.count;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
            const endIndex = Math.min(page * pageSize, totalItems);

            return (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {`Ko'rsatilmoqda ${startIndex}-${endIndex} / ${totalItems}`}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || !paginationInfo.previous}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Oldingi
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {`Sahifa ${page} / ${totalPages}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || !paginationInfo.next}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Quick Create Vacancy Modal */}
      <QuickCreateVacancyModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={() => {
          setIsQuickCreateOpen(false);
          // Optionally refresh departments list
          fetchDepartments();
        }}
      />
    </div>
  );
};

export default Departments;
