import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import EditOverallResultsModal from "../components/modals/EditOverallResultsModal";
import SendInterviewNotificationModal from "../components/modals/SendInterviewNotificationModal";
import { getAttemptsApi } from "../utils/api";

const UmumiyNatijalar = () => {
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
    document.title = "Umumiy natijalar - Markaziy Bank Administratsiyasi";
  }, []);

  useEffect(() => {
    // When date changes, refetch results
    fetchResults();
  }, [selectedDate]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedDate) {
        setResults([]);
        setPage(1);
        setLoading(false);
        return;
      }

      // Call API with selected date and overall_result filter
      const response = await getAttemptsApi({
        end_time: selectedDate,
        overall_result: true,
      });

      // Extract results from API response
      const attempts = response?.results || [];

      // Map API response to component format (backend already filters by overall_result === true)
      const mappedResults = attempts.map((attempt) => {
          // Determine interview type from interview_details (when available)
          let interviewType = null;

          // When interview_details is ready, use this:
          if (attempt.interview_details?.interview_type) {
            interviewType =
              attempt.interview_details.interview_type === "online"
                ? "onlayn"
                : attempt.interview_details.interview_type === "offline"
                ? "oflayn"
                : null;
          }
          // For now, if interview_details is not available, it will remain null (showing "Kutilmoqda")

          // Calculate test score and percentage
          const testScore = attempt.score || 0;
          // If score is <= 100, assume max_score is 100 (percentage-based)
          // Otherwise, calculate based on total_questions
          let testMaxScore = 100;
          if (testScore > 100 && attempt.test?.total_questions) {
            // If score > 100, it might be points-based, estimate max_score
            testMaxScore = attempt.test.total_questions * 10; // Rough estimate
          }
          // Calculate percentage: if score <= 100, it might already be a percentage
          // Otherwise, calculate as (score / max_score) * 100
          const testPercentage =
            testScore <= 100
              ? parseFloat(testScore.toFixed(2))
              : testMaxScore > 0
              ? parseFloat(((testScore / testMaxScore) * 100).toFixed(2))
              : 0;

          return {
            id: attempt.id,
            user_name:
              attempt.application?.full_name ||
              attempt.chat?.full_name ||
              "Ma'lumot yo'q",
            phone_number:
              attempt.chat?.phone_number ||
              attempt.application?.phone_number ||
              "Ma'lumot yo'q",
            vacancy_title:
              attempt.application?.vacancy?.title_uz || "Ma'lumot yo'q",
            test_score: testScore,
            test_max_score: testMaxScore,
            test_percentage: testPercentage,
            test_passed: attempt.is_passed || false,
            test_date: attempt.end_time || attempt.start_time,
            russian_level: attempt.actual_russian_level || null,
            english_level: attempt.actual_english_level || null,
            required_russian_level:
              attempt.application?.vacancy?.lan_requirements_ru || null,
            required_english_level:
              attempt.application?.vacancy?.lan_requirements_eng || null,
            meeting_attended: attempt.attend !== null ? attempt.attend : false,
            language_interview_passed:
              attempt.overall_result === true && attempt.attend === true,
            language_interview_date:
              attempt.interview_details?.interview_date ||
              attempt.meeting_details?.meet_date ||
              attempt.end_time ||
              null,
            interview_type: interviewType,
            overall_passed: attempt.overall_result === true,
            created_at: attempt.end_time || attempt.start_time,
            // Store original attempt data for potential updates
            _originalAttempt: attempt,
          };
        });

      setResults(mappedResults);
      setPage(1);
    } catch (error) {
      console.error("Error fetching overall results:", error);
      setError(
        error.message || "Umumiy natijalarni yuklashda xatolik yuz berdi"
      );
      toast.error("Umumiy natijalarni yuklashda xatolik yuz berdi");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditResults = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveResults = (updatedUser) => {
    setResults((prev) =>
      prev.map((r) => (r.id === updatedUser.id ? updatedUser : r))
    );
    setIsEditModalOpen(false);
    setSelectedUser(null);
    toast.success("Natijalar muvaffaqiyatli saqlandi");
  };

  const handleNotificationSuccess = () => {
    fetchResults();
    setIsNotificationModalOpen(false);
  };

  // Filter results by selected date (now handled by API, but keeping for search filtering)
  const filterByDate = (result) => {
    if (!selectedDate) return true;

    const resultDate = result.language_interview_date || result.test_date;
    if (!resultDate) return false;

    try {
      const date = new Date(resultDate);
      const selected = new Date(selectedDate);

      // Compare only date part (ignore time)
      return (
        date.getFullYear() === selected.getFullYear() &&
        date.getMonth() === selected.getMonth() &&
        date.getDate() === selected.getDate()
      );
    } catch {
      return false;
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    // Prepare data for Excel
    const excelData = filtered.map((result, index) => ({
      "T/r": index + 1,
      Foydalanuvchi: result.user_name || "Ma'lumot yo'q",
      "Telefon raqami": result.phone_number || "Ma'lumot yo'q",
      Vakansiya: result.vacancy_title || "Ma'lumot yo'q",
      "Test balli": `${result.test_score || 0} / ${
        result.test_max_score || 100
      }`,
      "Test foizi": `${result.test_percentage || 0}%`,
      "Test holati": result.test_passed ? "O'tdi" : "O'tmadi",
      "Rus tili": result.russian_level || "Ma'lumot yo'q",
      "Ingliz tili": result.english_level || "Ma'lumot yo'q",
      "Til suhbati holati": result.language_interview_passed
        ? "O'tdi"
        : "Kutilmoqda",
      "Suhbat shakli":
        result.interview_type === "onlayn"
          ? "Onlayn"
          : result.interview_type === "oflayn"
          ? "Oflayn"
          : "Kutilmoqda",
      "Test sanasi": formatDate(result.test_date),
      "Til suhbati sanasi": formatDate(result.language_interview_date),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Umumiy natijalar");

    // Generate filename with date
    const dateStr = selectedDate
      ? new Date(selectedDate).toLocaleDateString("uz-UZ").replace(/\//g, "-")
      : "barcha";
    const filename = `umumiy-natijalar-${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    toast.success("Excel fayl muvaffaqiyatli yuklab olindi");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("uz-UZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
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

  // Filter and paginate results
  const q = query.trim().toLowerCase();
  const filtered = results.filter((result) => {
    // Date filter (API already filters by date, but keeping for consistency)
    if (!filterByDate(result)) return false;

    // Search filter
    if (q) {
      const inUserName = result.user_name?.toLowerCase().includes(q);
      const inVacancy = result.vacancy_title?.toLowerCase().includes(q);
      if (!inUserName && !inVacancy) return false;
    }
    return true;
  });

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginated = filtered.slice(startIndex, endIndex);
  const showingStart = total === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, total);
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
              Umumiy natijalar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Test va til suhbatidan o'tgan foydalanuvchilar ro'yxati
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

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Qidirish: foydalanuvchi, vakansiya..."
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
          {/* Send Notification Button */}
          <button
            onClick={() => {
              if (filtered.length === 0) {
                toast.error("Yuborish uchun foydalanuvchilar yo'q");
                return;
              }
              setIsNotificationModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Bildirishnoma yuborish
          </button>

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
            Natijalar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha test va til suhbatidan o'tgan foydalanuvchilar mavjud emas.
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
                      Foydalanuvchi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider max-w-xs">
                      Vakansiya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Test natijasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Til suhbati
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Suhbat shakli
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Holat
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginated.map((result, index) => (
                    <tr
                      key={result.id}
                      onClick={() => handleEditResults(result)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {result.user_name || "Ma'lumot yo'q"}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={result.vacancy_title || "Ma'lumot yo'q"}>
                          {result.vacancy_title || "Ma'lumot yo'q"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {result.test_score || 0} /{" "}
                          {result.test_max_score || 100} (
                          {result.test_percentage || 0}%)
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(result.test_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          Rus: {result.russian_level || "N/A"}, Eng:{" "}
                          {result.english_level || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(result.language_interview_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.interview_type === "onlayn" ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Onlayn
                          </span>
                        ) : result.interview_type === "oflayn" ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Oflayn
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            Kutilmoqda
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          Kutilmoqda
                        </span>
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

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <EditOverallResultsModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleSaveResults}
        />
      )}

      {/* Notification Modal */}
      {isNotificationModalOpen && (
        <SendInterviewNotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => {
            setIsNotificationModalOpen(false);
          }}
          users={filtered}
          selectedDate={selectedDate}
          onSuccess={handleNotificationSuccess}
        />
      )}
    </div>
  );
};

export default UmumiyNatijalar;
