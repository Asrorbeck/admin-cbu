import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTestsApi, getTestByIdApi, deleteTestApi } from "../utils/api";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/modals/ConfirmDialog";

const Testlar = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
    document.title = "Testlar - Markaziy Bank Administratsiyasi";
  }, [page, pageSize]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTestsApi({ page, page_size: pageSize });
      // Handle paginated response structure: { count, next, previous, results: [...] }
      if (data && typeof data === 'object' && 'results' in data) {
        setTests(data.results || []);
        setTotalCount(data.count || 0);
        setHasNext(!!data.next);
        setHasPrevious(!!data.previous);
      } else if (Array.isArray(data)) {
        // Fallback for non-paginated response
        setTests(data);
        setTotalCount(data.length);
        setHasNext(false);
        setHasPrevious(false);
      } else {
        setTests([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrevious(false);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      setError(error.message);
      toast.error("Testlarni yuklashda xatolik yuz berdi");
      // Set empty array on error to prevent filter errors
      setTests([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (durationMinutes, duration) => {
    // If duration_minutes exists, use it
    if (
      durationMinutes !== undefined &&
      durationMinutes !== null &&
      durationMinutes !== ""
    ) {
      return `${durationMinutes} daqiqa`;
    }

    // If duration exists in HH:MM:SS format, parse it
    if (duration && typeof duration === "string" && duration.includes(":")) {
      const parts = duration.split(":");
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        const totalMinutes = hours * 60 + minutes + (seconds > 0 ? 1 : 0);
        return `${totalMinutes} daqiqa`;
      }
    }

    // If duration is already a number, use it
    if (duration && typeof duration === "number") {
      return `${duration} daqiqa`;
    }

    return "Ma'lumot yo'q";
  };

  const handleViewTest = async (testId) => {
    try {
      setViewLoading(true);
      setIsViewModalOpen(true);
      const testData = await getTestByIdApi(testId);
      setSelectedTest(testData);
    } catch (error) {
      console.error("Error fetching test details:", error);
      toast.error("Test ma'lumotlarini yuklashda xatolik yuz berdi");
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEditTest = (testId) => {
    navigate(`/testlar/edit/${testId}`);
  };

  const handleDeleteClick = (test) => {
    setTestToDelete(test);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;

    try {
      setDeleting(true);
      await deleteTestApi(testToDelete.id);
      toast.success("Test muvaffaqiyatli o'chirildi");
      setIsDeleteDialogOpen(false);
      setTestToDelete(null);
      // Refresh the list - if current page becomes empty, go to previous page
      const currentPageTests = tests.length;
      if (currentPageTests === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchTests();
      }
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Testni o'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setIsModalExpanded(false);
    setTimeout(() => setSelectedTest(null), 300);
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
          onClick={fetchTests}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Filter tests (client-side search only, pagination is server-side)
  const safeTests = Array.isArray(tests) ? tests : [];
  const q = query.trim().toLowerCase();
  const filtered = safeTests.filter((test) => {
    // Search filter
    if (q) {
      const inTitle = test.title?.toLowerCase().includes(q);
      if (!inTitle) return false;
    }
    return true;
  });

  // Calculate pagination info from backend response
  const total = totalCount;
  const showingStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/kadrlar")}
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
              Testlar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Testlarni boshqarish va ko'rish
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/testlar/new")}
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
            Yangi test yaratish
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 sm:max-w-sm flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // Don't reset page for client-side search
              }}
              placeholder="Qidirish: test nomi..."
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
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Sahifa hajmi:
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setPageSize(size);
              setPage(1); // Reset to first page when changing page size
            }}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            {[5, 10, 15, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {!Array.isArray(tests) || tests.length === 0 ? (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Testlar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Birinchi testni qo'shish uchun tugmani bosing.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      T/r
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nomi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vaqt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Max. buzilishlar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Savollar soni
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map((test, index) => (
                    <tr
                      key={test.id}
                      onClick={() => handleViewTest(test.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {test.title || "Ma'lumot yo'q"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDuration(test.duration_minutes, test.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {test.max_violations !== undefined &&
                        test.max_violations !== null
                          ? test.max_violations
                          : "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {test.total_questions !== undefined &&
                        test.total_questions !== null
                          ? test.total_questions
                          : test.questions?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTest(test.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="To'liq ko'rish"
                          >
                            <svg
                              className="h-4 w-4"
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTest(test.id);
                            }}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Tahrirlash"
                          >
                            <svg
                              className="h-4 w-4"
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
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(test);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="O'chirish"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {`Ko'rsatilmoqda ${showingStart}-${showingEnd} / ${total}`}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrevious || page === 1}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Oldingi
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {`Sahifa ${page} / ${totalPages}`}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNext || page >= totalPages}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Keyingi
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Test Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={closeViewModal}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div
              className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all ${
                isModalExpanded
                  ? "fixed inset-0 w-screen h-screen max-w-none m-0 rounded-none"
                  : "sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              }`}
            >
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Test tafsilotlari
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsModalExpanded(!isModalExpanded)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={
                        isModalExpanded ? "Kichiklashtirish" : "Kattalashtirish"
                      }
                    >
                      {isModalExpanded ? (
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
                            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                          />
                        </svg>
                      ) : (
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
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={closeViewModal}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`px-6 py-5 space-y-5 overflow-y-auto ${
                  isModalExpanded
                    ? "max-h-[calc(100vh-150px)]"
                    : "max-h-[calc(100vh-250px)]"
                }`}
              >
                {viewLoading ? (
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
                ) : selectedTest ? (
                  <>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Test nomi
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedTest.title || "Ma'lumot yo'q"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Vaqt
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDuration(
                            selectedTest.duration_minutes,
                            selectedTest.duration
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Maksimal buzilishlar
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedTest.max_violations !== undefined &&
                          selectedTest.max_violations !== null
                            ? selectedTest.max_violations
                            : "Ma'lumot yo'q"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Savollar soni
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedTest.total_questions !== undefined &&
                          selectedTest.total_questions !== null
                            ? selectedTest.total_questions
                            : selectedTest.questions?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Questions */}
                    {selectedTest.questions &&
                      selectedTest.questions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Savollar
                          </h4>
                          <div className="space-y-4">
                            {selectedTest.questions.map((question, qIndex) => (
                              <div
                                key={question.id || qIndex}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40"
                              >
                                <div className="flex items-start space-x-3 mb-3">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    {qIndex + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {question.text || "Ma'lumot yo'q"}
                                    </p>
                                  </div>
                                </div>
                                {question.choices &&
                                  question.choices.length > 0 && (
                                    <div className="ml-11 space-y-2">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Variantlar:
                                      </p>
                                      {question.choices.map(
                                        (choice, cIndex) => (
                                          <div
                                            key={choice.id || cIndex}
                                            className={`flex items-center space-x-2 p-2 rounded border ${
                                              choice.is_correct
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                                            }`}
                                          >
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {cIndex + 1}.
                                            </span>
                                            <span
                                              className={`text-sm flex-1 ${
                                                choice.is_correct
                                                  ? "text-green-700 dark:text-green-300 font-medium"
                                                  : "text-gray-700 dark:text-gray-300"
                                              }`}
                                            >
                                              {choice.text || "Ma'lumot yo'q"}
                                            </span>
                                            {choice.is_correct && (
                                              <svg
                                                className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                              >
                                                <path
                                                  fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                ) : null}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Testni o'chirish"
        description={`"${
          testToDelete?.title || "Bu test"
        }" ni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        confirmText={deleting ? "O'chirilmoqda..." : "O'chirish"}
        cancelText="Bekor qilish"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setTestToDelete(null);
        }}
      />
    </div>
  );
};

export default Testlar;
