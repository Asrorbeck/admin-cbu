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
  const [query, setQuery] = useState("");
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Fetch departments from API
  useEffect(() => {
    fetchDepartments();
    document.title = "Departamentlar - Markaziy Bank Administratsiyasi";
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartmentsApi();
      console.log("Departments API response:", data);
      
      // Handle different response formats
      let departmentsArray = [];
      if (Array.isArray(data)) {
        departmentsArray = data;
      } else if (data && Array.isArray(data.results)) {
        // Paginated response format: { results: [...], count: ... }
        departmentsArray = data.results;
      } else if (data && Array.isArray(data.data)) {
        // Wrapped response format: { data: [...] }
        departmentsArray = data.data;
      } else if (data && typeof data === 'object') {
        // Single object or other format - try to extract array
        console.warn("Unexpected departments response format:", data);
        departmentsArray = [];
      }
      
      console.log("Processed departments array:", departmentsArray);
      setDepartmentsData(departmentsArray);
      setPage(1);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError(error.message);
      toast.error("Departamentlarni yuklashda xatolik yuz berdi");
      // Set empty array on error to prevent filter errors
      setDepartmentsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (updatedData) => {
    const payload = {
      name: updatedData.name,
      description: updatedData.description,
      department_tasks: (updatedData.department_tasks || []).filter(
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
      setDepartmentsData((prev) => {
        const updated = prev.filter((dept) => dept.id !== departmentId);
        // Recalculate total pages based on current filter
        const q = query.trim().toLowerCase();
        const filtered = updated.filter((d) => {
          if (!q) return true;
          const inName = d.name?.toLowerCase().includes(q);
          const inDesc = d.description?.toLowerCase().includes(q);
          const inTasks = (d.department_tasks || []).some((t) =>
            (t.task || "").toLowerCase().includes(q)
          );
          return inName || inDesc || inTasks;
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (page > totalPages) setPage(totalPages);
        return updated;
      });
      toast.success("Departament muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error(error.message || "Departamentni o'chirishda xatolik yuz berdi");
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

      {/* Filters Row: Search (left) and Page Size (right) */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 sm:max-w-sm flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Qidirish: nomi, tavsifi yoki vazifa..."
              className="w-full pr-7 pl-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm placeholder:text-sm text-gray-900 dark:text-white"
            />
            <svg
              className="h-3.5 w-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m1.35-4.65a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
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
        (() => {
          // Ensure departmentsData is an array before filtering
          const safeDepartmentsData = Array.isArray(departmentsData) ? departmentsData : [];
          const q = query.trim().toLowerCase();
          const filtered = safeDepartmentsData.filter((d) => {
            if (!q) return true;
            const inName = d.name?.toLowerCase().includes(q);
            const inDesc = d.description?.toLowerCase().includes(q);
            const inTasks = (d.department_tasks || []).some((t) =>
              (t.task || "").toLowerCase().includes(q)
            );
            return inName || inDesc || inTasks;
          });

          const total = filtered.length;
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginated = filtered.slice(startIndex, endIndex);
          const showingStart = total === 0 ? 0 : startIndex + 1;
          const showingEnd = Math.min(endIndex, total);
          const totalPages = Math.max(1, Math.ceil(total / pageSize));

          return (
            <>
              <DepartmentsTable
                departments={paginated}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />

              {/* Pagination controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {`Ko'rsatilmoqda ${showingStart}-${showingEnd} / ${total}`}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:opacity-50"
                  >
                    Oldingi
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {`Sahifa ${page} / ${totalPages}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:opacity-50"
                    disabled={page >= totalPages}
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            </>
          );
        })()
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
