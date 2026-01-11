import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAttemptsApi } from "../utils/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const TestNatijalari = () => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [passedFilter, setPassedFilter] = useState("all");
  const [selectedResult, setSelectedResult] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
    document.title = "Test natijalari - Markaziy Bank Administratsiyasi";
  }, []);

  useEffect(() => {
    // When filters change, refetch results
    fetchResults();
  }, [selectedDate, statusFilter, passedFilter, page, pageSize]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API params
      const params = {
        page: page,
        page_size: pageSize,
      };

      // Add date filter (end_time)
      if (selectedDate) {
        params.end_time = selectedDate;
      }

      // Add status filter
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      // Add passed filter
      if (passedFilter !== "all") {
        params.is_passed = passedFilter === "passed";
      }

      const data = await getAttemptsApi(params);
      // Handle paginated response structure: { count, next, previous, results: [...] }
      const resultsArray = Array.isArray(data)
        ? data
        : data?.results || data?.data || [];
      setResults(resultsArray);
      setTotalCount(data?.count || resultsArray.length);
    } catch (error) {
      console.error("Error fetching test results:", error);
      setError(error.message);
      toast.error("Test natijalarini yuklashda xatolik yuz berdi");
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Note: Date filtering is now handled by backend via end_time parameter

  // Export to Excel
  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    // Prepare data for Excel
    const excelData = filtered.map((result, index) => {
      return {
        "T/r": index + 1,
        "Test nomi": result.test?.title || "Ma'lumot yo'q",
        Foydalanuvchi:
          result.chat?.full_name || result.chat?.username || "Ma'lumot yo'q",
        Telefon: result.chat?.phone_number || "Ma'lumot yo'q",
        Foiz:
          result.score !== undefined && result.score !== null
            ? `${result.score}%`
            : "Ma'lumot yo'q",
        "O'tish foizi": result.test?.pass_score
          ? `${result.test.pass_score}%`
          : "Ma'lumot yo'q",
        "Vaqt (soniya)": result.duration || 0,
        Buzilishlar: result.violations_count || 0,
        "Boshlanish vaqti": formatDate(result.start_time),
        "Tugash vaqti": formatDate(result.end_time),
        Holat: result.is_passed ? "O'tdi" : "O'tmadi",
        Status: result.status_display || result.status || "Noma'lum",
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test natijalari");

    // Generate filename with date
    const dateStr = selectedDate
      ? new Date(selectedDate).toLocaleDateString("uz-UZ").replace(/\//g, "-")
      : "barcha";
    const filename = `test-natijalari-${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    toast.success("Excel fayl muvaffaqiyatli yuklab olindi");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    try {
      const date = new Date(dateString);
      const months = [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ];

      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const formatScore = (score, maxScore) => {
    if (score === undefined || score === null) return "Ma'lumot yo'q";
    if (maxScore) {
      return `${score} / ${maxScore}`;
    }
    return `${score}`;
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setTimeout(() => setSelectedResult(null), 300);
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "Ma'lumot yo'q";
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} daqiqa`;
    } else if (minutes === 0) {
      return `${hours} soat`;
    } else {
      return `${hours} soat ${minutes} daqiqa`;
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
          onClick={fetchResults}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Client-side search filter (backend already handles pagination, date, status, and passed filters)
  const q = query.trim().toLowerCase();
  const filtered = results.filter((result) => {
    // Search filter (client-side only, other filters handled by backend)
    if (q) {
      const inTestTitle = result.test?.title?.toLowerCase().includes(q);
      const inUserName = result.chat?.full_name?.toLowerCase().includes(q);
      const inUsername = result.chat?.username?.toLowerCase().includes(q);
      if (!inTestTitle && !inUserName && !inUsername) return false;
    }
    return true;
  });

  // Backend handles pagination, so we use results directly
  const total = totalCount || filtered.length;
  const paginated = filtered; // Backend already paginated
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
              Test natijalari
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Barcha test natijalarini ko'rish va boshqarish
            </p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Sana:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barchasi</option>
              <option value="IN_PROGRESS">Jarayonda</option>
              <option value="COMPLETED">Yakunlandi</option>
              <option value="TIMEOUT">Vaqt tugadi</option>
              <option value="DISQUALIFIED">Diskvalifikatsiya</option>
            </select>
          </div>

          {/* Passed Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Holat:
            </label>
            <select
              value={passedFilter}
              onChange={(e) => {
                setPassedFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barchasi</option>
              <option value="passed">O'tdi</option>
              <option value="failed">O'tmadi</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Qidirish: test nomi, foydalanuvchi..."
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
        <div className="flex items-center justify-end space-x-3">
          {/* Excel Export Button */}
          <button
            onClick={exportToExcel}
            disabled={filtered.length === 0}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Excel yuklab olish
          </button>

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
            {[5, 10, 15, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {results.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Test natijalari yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha test natijalari mavjud emas.
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
                      Test nomi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Foydalanuvchi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Foiz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vaqt (soniya)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Buzilishlar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tugash vaqti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Holat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginated.map((result, index) => (
                    <tr
                      key={result.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {showingStart + index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {result.test?.title || "Ma'lumot yo'q"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">
                            {result.chat?.full_name ||
                              result.chat?.username ||
                              "Ma'lumot yo'q"}
                          </div>
                          {result.chat?.phone_number && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {result.chat.phone_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.score !== undefined && result.score !== null
                          ? `${result.score}%`
                          : "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDuration(result.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.violations_count !== undefined &&
                        result.violations_count !== null
                          ? result.violations_count
                          : 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(result.end_time || result.start_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.is_passed
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {result.is_passed ? "O'tdi" : "O'tmadi"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(result)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="To'liq ko'rish"
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
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Keyingi
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={closeViewModal}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Test natijasi tafsilotlari
                  </h3>
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

              <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Test Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                    Test ma'lumotlari
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Test nomi
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.test?.title || "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Savollar soni
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.test?.total_questions ||
                          "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        O'tish foizi
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.test?.pass_score
                          ? `${selectedResult.test.pass_score}%`
                          : "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Maksimal buzilishlar
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.test?.max_violations || "Ma'lumot yo'q"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                    Foydalanuvchi ma'lumotlari
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        To'liq ism
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.chat?.full_name ||
                          selectedResult.chat?.username ||
                          "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Username
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.chat?.username || "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Telefon raqami
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.chat?.phone_number || "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        User ID
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.chat?.user_id || "Ma'lumot yo'q"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                    Test natijalari
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Foiz
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {selectedResult.score !== undefined &&
                        selectedResult.score !== null
                          ? `${selectedResult.score}%`
                          : "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        O'tish foizi
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {selectedResult.test?.pass_score
                          ? `${selectedResult.test.pass_score}%`
                          : "Ma'lumot yo'q"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Vaqt
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDuration(selectedResult.duration)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Buzilishlar soni
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.violations_count !== undefined &&
                        selectedResult.violations_count !== null
                          ? selectedResult.violations_count
                          : 0}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Holat
                      </label>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedResult.is_passed
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {selectedResult.is_passed ? "O'tdi" : "O'tmadi"}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Status
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedResult.status_display ||
                          selectedResult.status ||
                          "Ma'lumot yo'q"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                    Vaqt ma'lumotlari
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Boshlanish vaqti
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedResult.start_time)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Tugash vaqti
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedResult.end_time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Application Information (if exists) */}
                {selectedResult.application && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                      Ariza ma'lumotlari
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Ariza ID
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedResult.application.id || "Ma'lumot yo'q"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
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
    </div>
  );
};

export default TestNatijalari;
