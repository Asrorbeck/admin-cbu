import { useState, useEffect } from "react";
import {
  getCorruptionReportsApi,
  getCorruptionReportByIdApi,
  updateCorruptionReportApi,
  sendReportResponseApi,
  getReportResponsesApi,
} from "../utils/api";
import toast from "react-hot-toast";

const KorrupsiyaMurojaatlar = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [status, setStatus] = useState("waiting");
  const [savingStatus, setSavingStatus] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    document.title =
      "Korrupsiya murojaatlari - Murojaatlar - Markaziy Bank Administratsiyasi";
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCorruptionReportsApi(selectedDate);
      // Handle new paginated response structure: { count, next, previous, results: [...] }
      const reportsList = data?.results || (Array.isArray(data) ? data : []);
      setReports(reportsList);
      setPage(1);
    } catch (e) {
      setError(e.message || "Xatolik yuz berdi");
      toast.error("Murojaatlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("uz-UZ");
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      waiting: {
        label: "Kutilmoqda",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
      accepted: {
        label: "Qabul qilindi",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
      rejected: {
        label: "Rad etildi",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
    };

    const statusInfo = statusMap[status] || statusMap.waiting;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleRowClick = async (report) => {
    try {
      setIsModalOpen(true);
      setResponseText("");
      setResponses([]);
      
      // Fetch full report details from API
      const fullReport = await getCorruptionReportByIdApi(report.id);
      setSelectedReport(fullReport);
      setStatus(fullReport.status || "waiting");
      
      // Fetch responses
      await fetchResponses(report.id);
    } catch (error) {
      toast.error("Murojaat ma'lumotlarini yuklashda xatolik yuz berdi");
      console.error("Failed to fetch report details:", error);
      // Fallback to basic report data
      setSelectedReport(report);
      setStatus(report.status || "waiting");
      fetchResponses(report.id);
    }
  };

  const fetchResponses = async (reportId) => {
    if (!reportId) return;
    try {
      setLoadingResponses(true);
      const data = await getReportResponsesApi(reportId);
      // Handle paginated response
      const responsesList = data?.results || (Array.isArray(data) ? data : []);
      setResponses(responsesList);
    } catch (error) {
      console.error("Failed to fetch responses:", error);
      setResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedReport(null);
      setStatus("waiting");
      setResponseText("");
      setResponses([]);
    }, 200);
  };

  const handleSaveStatus = async () => {
    if (!selectedReport) return;
    
    // Check if response already exists
    const hasResponse = (selectedReport.responses_count > 0) || (responses.length > 0);
    
    // If response already exists, don't allow sending another response
    if (hasResponse) {
      toast.error("Bu murojaatga allaqachon javob yuborilgan");
      return;
    }
    
    // Validate that status is either accepted or rejected
    if (!status || (status !== "accepted" && status !== "rejected")) {
      toast.error("Holatni tanlang (Qabul qilindi yoki Rad etildi)");
      return;
    }
    
    try {
      setSavingStatus(true);
      
      // Send response with status via /send-response endpoint
      await toast.promise(
        sendReportResponseApi(selectedReport.id, responseText || "", status),
        {
          loading: "Saqlanmoqda...",
          success: "Holat va javob saqlandi",
          error: (err) => err?.message || "Xatolik yuz berdi",
        }
      );
      
      // Refresh report data and responses
      const updatedReport = await getCorruptionReportByIdApi(selectedReport.id);
      setSelectedReport(updatedReport);
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? updatedReport : r
        )
      );
      
      // Refresh responses
      await fetchResponses(selectedReport.id);
      
      // Clear response text after successful save
      setResponseText("");
      
      // Close modal after successful save
      closeModal();
    } catch {
    } finally {
      setSavingStatus(false);
    }
  };


  // Pagination logic
  const total = reports.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedReports = reports.slice(startIndex, endIndex);
  const showingStart = total === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
          onClick={fetchReports}
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
            Murojaatlar bo'limi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Korrupsiya murojaatlari
          </p>
        </div>
      </div>

      {/* Filters Row: Date Picker (left) and Page Size (right) */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Sana:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {reports.length === 0 ? (
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Murojaatlar yo'q
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hozircha murojaatlar mavjud emas
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      №
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      To'liq ism-familiya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Telefon raqami
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Qisqacha mazmun
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Anonim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Holati
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedReports.map((report, index) => (
                    <tr
                      key={report.id || report.user_id || index}
                      onClick={() => handleRowClick(report)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {report.id || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {report.full_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {report.phone_number || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {report.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                        {truncateText(report.summary, 50)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {report.is_anonymous ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            Ha
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                            Yo'q
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(report.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {`Ko'rsatilmoqda ${showingStart}-${showingEnd} / ${total}`}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
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
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={closeModal}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Murojaat tafsilotlari
                </h3>
                <button
                  onClick={closeModal}
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

              {/* Content */}
              <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      To'liq ism-familiya
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.full_name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Telefon raqami
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.phone_number || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Til
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.language || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Anonim
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.is_anonymous ? "Ha" : "Yo'q"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Yaratilgan sana
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {formatDateTime(selectedReport.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      User ID
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.user_id || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Javoblar soni
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedReport.responses_count || 0}
                    </p>
                  </div>
                </div>

                {selectedReport.summary && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Qisqacha mazmun
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedReport.summary}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Xabar matni
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                    {selectedReport.message_text || "-"}
                  </p>
                </div>

                {/* Status Select */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Holati
                  </p>
                  <select
                    value={status === "waiting" ? "" : status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={savingStatus}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Holatni tanlang</option>
                    <option value="accepted">Qabul qilindi</option>
                    <option value="rejected">Rad etildi</option>
                  </select>
                </div>

                {/* Responses Section */}
                {loadingResponses ? (
                  <div className="flex items-center justify-center py-4">
                    <svg
                      className="animate-spin h-5 w-5 text-blue-600"
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
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Javoblar yuklanmoqda...
                    </span>
                  </div>
                ) : responses.length > 0 ? (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                      Javoblar ({responses.length})
                    </p>
                    <div className="space-y-3">
                      {responses.map((response, idx) => (
                        <div
                          key={response.id || idx}
                          className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {formatDateTime(response.sent_at || response.created_at || response.response_date)}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                            {response.response_text || response.text || "-"}
                          </p>
                          {response.response_file && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <a
                                href={response.response_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                Fayl yuklab olish
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Response Form - Always visible */}
                {(() => {
                  const hasResponse = (selectedReport.responses_count > 0) || (responses.length > 0);
                  return (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Javob yozish
                        {hasResponse && (
                          <span className="ml-2 text-orange-600 dark:text-orange-400">
                            (Allaqachon javob yuborilgan)
                          </span>
                        )}
                      </p>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={hasResponse ? "Bu murojaatga allaqachon javob yuborilgan" : "Javob matnini kiriting..."}
                        rows={4}
                        disabled={savingStatus || hasResponse}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={savingStatus || (selectedReport.responses_count > 0) || (responses.length > 0)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {savingStatus ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Holatni saqlash"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KorrupsiyaMurojaatlar;

