import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getRestrictionsApi, deleteRestrictionApi, updateRestrictionApi } from "../utils/api";
import ConfirmDialog from "../components/modals/ConfirmDialog";

const TestdanOtaOlmaganlar = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingRestrictionId, setDeletingRestrictionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
    document.title = "Cheklov o'rnatilganlar - Markaziy Bank Administratsiyasi";
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch restrictions from API (all restrictions, not just active ones)
      const response = await getRestrictionsApi();
      
      // Handle paginated response format: { results: [...], count: ... }
      const restrictions = Array.isArray(response) 
        ? response 
        : (response?.results || response?.data || []);
      
      // Map API response to component format
      const mappedResults = restrictions.map((restriction) => {
        const canRetake = restriction.days_remaining <= 0;
        const daysUntilRetake = restriction.days_remaining || 0;
        
        const jobTitle = restriction.application_info?.job_title_uz || restriction.application_info?.job_title || "Ma'lumot yo'q";
        return {
          id: restriction.id,
          jshshir: restriction.jshshir || "Ma'lumot yo'q",
          user_name: jobTitle !== "Ma'lumot yo'q" ? `Ariza: ${jobTitle}` : "Ma'lumot yo'q",
          user_email: restriction.jshshir || "Ma'lumot yo'q",
          phone_number: restriction.jshshir || "Ma'lumot yo'q",
          test_title: jobTitle,
          test_id: restriction.related_application || null,
          failed_date: restriction.last_failed_test_date || new Date().toISOString(),
          score: restriction.test_score || 0,
          max_score: 100, // Default, can be adjusted if needed
          percentage: restriction.test_score || 0,
          can_retake: canRetake,
          days_until_retake: daysUntilRetake,
          admin_override: !restriction.is_active, // If not active, admin has overridden
          can_apply_after: restriction.can_apply_after,
          application_id: restriction.related_application,
          application_info: restriction.application_info,
          is_active: restriction.is_active,
          restriction_data: restriction, // Store original data
        };
      });
      
      setResults(mappedResults);
      setPage(1);
    } catch (error) {
      console.error("Error fetching restrictions:", error);
      setError(error.message || "Xatolik yuz berdi");
      toast.error("Cheklov o'rnatilganlar ro'yxatini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Allow admin to override the restriction (deactivate)
  const handleAllowRetake = async (result) => {
    try {
      // Deactivate the restriction
      await toast.promise(
        updateRestrictionApi(result.id, { is_active: false }),
        {
          loading: "Cheklov bekor qilinmoqda...",
          success: "Cheklov muvaffaqiyatli bekor qilindi",
          error: "Cheklovni bekor qilishda xatolik yuz berdi",
        }
      );
      
      // Update local state - mark as inactive
      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id ? { ...r, is_active: false } : r
        )
      );
      
      toast.success(`JSHSHIR: ${result.jshshir} uchun cheklov bekor qilindi`);
    } catch (error) {
      console.error("Error removing restriction:", error);
      toast.error("Xatolik yuz berdi");
    }
  };

  // Activate the restriction
  const handleActivateRestriction = async (result) => {
    try {
      // Activate the restriction
      await toast.promise(
        updateRestrictionApi(result.id, { is_active: true }),
        {
          loading: "Cheklov aktivlashtirilmoqda...",
          success: "Cheklov muvaffaqiyatli aktivlashtirildi",
          error: "Cheklovni aktivlashtirishda xatolik yuz berdi",
        }
      );
      
      // Update local state - mark as active
      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id ? { ...r, is_active: true } : r
        )
      );
      
      toast.success(`JSHSHIR: ${result.jshshir} uchun cheklov aktivlashtirildi`);
    } catch (error) {
      console.error("Error activating restriction:", error);
      toast.error("Xatolik yuz berdi");
    }
  };

  // Delete restriction
  const handleDeleteClick = (restrictionId, e) => {
    if (e) e.stopPropagation();
    setDeletingRestrictionId(restrictionId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRestrictionId) return;
    try {
      setIsDeleting(true);
      await toast.promise(
        deleteRestrictionApi(deletingRestrictionId),
        {
          loading: "O'chirilmoqda...",
          success: "Cheklov muvaffaqiyatli o'chirildi",
          error: (err) =>
            err?.message || "Cheklovni o'chirishda xatolik yuz berdi",
        }
      );
      setResults((prev) =>
        prev.filter((r) => r.id !== deletingRestrictionId)
      );
      setDeleteConfirmOpen(false);
      setDeletingRestrictionId(null);
    } catch (error) {
      console.error("Error deleting restriction:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeletingRestrictionId(null);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const excelData = filtered.map((result, index) => ({
      "T/r": index + 1,
      "JSHSHIR": result.jshshir || "Ma'lumot yo'q",
      "Ish o'rni": result.test_title || "Ma'lumot yo'q",
      "Test balli": result.score || 0,
      "O'tkazilmagan sana": formatDate(result.failed_date),
      "Qayta topshirish mumkin": result.can_retake ? "Ha" : "Yo'q",
      "Qayta topshirishga qolgan kunlar": result.can_retake ? 0 : result.days_until_retake,
      "Qayta ariza berish mumkin": result.can_apply_after ? formatDate(result.can_apply_after) : "Ma'lumot yo'q",
      "Ariza holati": result.application_info?.status || "Ma'lumot yo'q",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cheklov o'rnatilganlar");

    const filename = `cheklov-ornatilganlar.xlsx`;
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
      const inJshshir = result.jshshir?.toLowerCase().includes(q);
      const inTestTitle = result.test_title?.toLowerCase().includes(q);
      const jobTitle = result.application_info?.job_title_uz || result.application_info?.job_title || "";
      const inJobTitle = jobTitle.toLowerCase().includes(q);
      if (!inJshshir && !inTestTitle && !inJobTitle) return false;
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cheklov o'rnatilganlar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Cheklov o'rnatilgan nomzodlar ro'yxati va cheklovlarni boshqarish
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
              <strong>Eslatma:</strong> Cheklov o'rnatilgan nomzodlar ma'lum muddatgacha yangi ariza bera olmaydi. 
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
              placeholder="Qidirish: JSHSHIR, ish o'rni..."
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
            Cheklovlar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha faol cheklovlar mavjud emas.
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
                      JSHSHIR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ish o'rni
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Test balli
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      O'tkazilmagan sana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Qayta ariza berish mumkin
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.jshshir || "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.test_title || result.application_info?.job_title_uz || result.application_info?.job_title || "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.score !== undefined ? result.score : "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(result.failed_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.can_apply_after ? formatDate(result.can_apply_after) : "Ma'lumot yo'q"}
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
                        <div className="flex items-center space-x-2">
                          {result.is_active ? (
                            <button
                              onClick={() => handleAllowRetake(result)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Cheklovni bekor qilish"
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
                          ) : (
                            <button
                              onClick={() => handleActivateRestriction(result)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Cheklovni aktivlashtirish"
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
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteClick(result.id, e)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Cheklovni o'chirish"
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Cheklovni o'chirish"
        description="Bu cheklovni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default TestdanOtaOlmaganlar;

