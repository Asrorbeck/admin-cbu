import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getAttemptsApi } from "../utils/api";

const TestdanOtaOlmaganlar = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
    document.title = "Testdan o'ta olmaganlar - Markaziy Bank Administratsiyasi";
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch failed attempts from API
      const response = await getAttemptsApi({ is_passed: false });
      
      // Handle paginated response format: { results: [...], count: ... }
      const attempts = Array.isArray(response) 
        ? response 
        : (response?.results || response?.data || []);
      
      // Map API response to component format
      const mappedResults = attempts.map((attempt) => {
        const endTime = attempt.end_time ? new Date(attempt.end_time) : new Date();
        
        // Calculate if 3 months have passed since the test was completed
        const threeMonthsLater = new Date(endTime);
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        const canRetake = new Date() >= threeMonthsLater;
        const daysUntilRetake = canRetake 
          ? 0 
          : Math.ceil((threeMonthsLater - new Date()) / (1000 * 60 * 60 * 24));
        
        // Calculate max_score and percentage
        // If test has pass_score, estimate max_score (typically pass_score is 50% of max)
        // Otherwise use total_questions * 10 as estimate, or default to 100
        let maxScore = 100; // Default max score
        if (attempt.test?.pass_score) {
          // Typically pass_score is 50% of max, so max is approximately 2x pass_score
          maxScore = attempt.test.pass_score * 2;
        } else if (attempt.test?.total_questions) {
          // Estimate: 10 points per question
          maxScore = attempt.test.total_questions * 10;
        }
        
        const percentage = maxScore > 0 
          ? Math.round((attempt.score / maxScore) * 100) 
          : 0;
        
        // Use username instead of email (backend doesn't provide email)
        const username = attempt.chat?.username || "Ma'lumot yo'q";
        
        return {
          id: attempt.id,
          user_name: attempt.chat?.full_name || attempt.chat?.username || "Ma'lumot yo'q",
          user_email: username, // Store username in user_email field for backward compatibility
          phone_number: attempt.chat?.phone_number || "Ma'lumot yo'q",
          test_title: attempt.test?.title || "Ma'lumot yo'q",
          test_id: attempt.test?.id || null,
          failed_date: attempt.end_time || attempt.start_time || new Date().toISOString(),
          score: attempt.score || 0,
          max_score: maxScore,
          percentage: percentage,
          can_retake: canRetake,
          days_until_retake: daysUntilRetake,
          admin_override: false, // Admin tomonidan cheklov bekor qilinganmi
          attempt_data: attempt, // Store original data for potential future use
        };
      });
      
      setResults(mappedResults);
      setPage(1);
    } catch (error) {
      console.error("Error fetching failed test takers:", error);
      setError(error.message || "Xatolik yuz berdi");
      toast.error("Testdan o'ta olmaganlar ro'yxatini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Allow admin to override the 3-month restriction
  const handleAllowRetake = async (result) => {
    try {
      // TODO: Replace with actual API call when endpoint is available
      // await allowTestRetakeApi(result.id);
      
      // Update local state
      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id
            ? { ...r, admin_override: true, can_retake: true, days_until_retake: 0 }
            : r
        )
      );
      toast.success(`${result.user_name} uchun test qayta topshirish imkoniyati ochildi`);
    } catch (error) {
      console.error("Error allowing retake:", error);
      toast.error("Xatolik yuz berdi");
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const excelData = filtered.map((result, index) => ({
      "T/r": index + 1,
      "Foydalanuvchi": result.user_name || "Ma'lumot yo'q",
      "Telegram username": result.user_email || "Ma'lumot yo'q",
      "Telefon": result.phone_number || "Ma'lumot yo'q",
      "Test nomi": result.test_title || "Ma'lumot yo'q",
      "Ball": `${result.score} / ${result.max_score}`,
      "Foiz": `${result.percentage}%`,
      "O'tkazilmagan sana": formatDate(result.failed_date),
      "Qayta topshirish mumkin": result.can_retake ? "Ha" : "Yo'q",
      "Qayta topshirishga qolgan kunlar": result.can_retake ? 0 : result.days_until_retake,
      "Admin tomonidan ochilgan": result.admin_override ? "Ha" : "Yo'q",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Testdan o'ta olmaganlar");

    const filename = `testdan-ota-olmaganlar.xlsx`;
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
    if (q) {
      const inUserName = result.user_name?.toLowerCase().includes(q);
      const inUsername = result.user_email?.toLowerCase().includes(q); // user_email contains username
      const inTestTitle = result.test_title?.toLowerCase().includes(q);
      if (!inUserName && !inUsername && !inTestTitle) return false;
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
              Testdan o'ta olmaganlar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Testdan o'ta olmagan foydalanuvchilar ro'yxati va qayta topshirish imkoniyatini boshqarish
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Eslatma:</strong> Testdan o'ta olmagan foydalanuvchilar keyingi 3 oy ichida testni qayta topshira olmaydi. 
              Admin tomonidan cheklov bekor qilinishi mumkin.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Qidirish: foydalanuvchi, username, test nomi..."
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
            Testdan o'ta olmaganlar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha testdan o'ta olmagan foydalanuvchilar mavjud emas.
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Test nomi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ball
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      O'tkazilmagan sana
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
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {result.user_name || "Ma'lumot yo'q"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.user_email || "Ma'lumot yo'q"}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {result.phone_number || "Ma'lumot yo'q"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.test_title || "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.score !== undefined && result.max_score !== undefined
                          ? `${result.score} / ${result.max_score} (${result.percentage}%)`
                          : "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(result.failed_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.can_retake || result.admin_override ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {result.admin_override ? "Admin tomonidan ochilgan" : "Qayta topshirish mumkin"}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {result.days_until_retake > 0
                              ? `${result.days_until_retake} kun qoldi`
                              : "Cheklangan"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!result.can_retake && !result.admin_override && (
                          <button
                            onClick={() => handleAllowRetake(result)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Qayta topshirish imkoniyatini ochish"
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                        )}
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
    </div>
  );
};

export default TestdanOtaOlmaganlar;

