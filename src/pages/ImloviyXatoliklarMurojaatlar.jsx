import { useState, useEffect } from "react";
import { getSpellingReportsApi, updateSpellingReportApi } from "../utils/api";
import toast from "react-hot-toast";

const ImloviyXatoliklarMurojaatlar = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [statusValue, setStatusValue] = useState("new");
  const [savingStatus, setSavingStatus] = useState(false);

  const STATUS_OPTIONS = [
    { value: "new", label: "Yangi" },
    { value: "pending", label: "Koʻrib chiqish kutilmoqda" },
    { value: "in_progress", label: "Jarayonda" },
    { value: "resolved", label: "Qanoatlantirildi" },
    { value: "rejected", label: "Rad etildi" },
  ];

  useEffect(() => {
    document.title = "Imloviy xatoliklar - Murojaatlar - Markaziy Bank Administratsiyasi";
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSpellingReportsApi();
      setAppeals(Array.isArray(data) ? data : []);
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

  const getStatusBadge = (s) => {
    const v = (s || "").toLowerCase();
    if (v === "new" || v === "appeal_new")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Yangi
        </span>
      );
    if (v === "pending" || v === "appeal_pending")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Koʻrib chiqish kutilmoqda
        </span>
      );
    if (v === "in_progress" || v === "appeal_in_progress")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          Jarayonda
        </span>
      );
    if (
      v === "closed_accepted" ||
      v === "appeal_closed_accepted" ||
      v === "resolved"
    )
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Qanoatlantirildi
        </span>
      );
    if (
      v === "closed_rejected" ||
      v === "appeal_closed_rejected" ||
      v === "rejected"
    )
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Rad etildi
        </span>
      );
    if (v === "thanks_sent")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
          Rahmat yuborildi
        </span>
      );
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
        {s || "Noma'lum"}
      </span>
    );
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleRowClick = (appeal) => {
    setSelectedAppeal(appeal);
    setStatusValue(((appeal.status || "new") + "").toLowerCase());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedAppeal(null);
      setStatusValue("new");
    }, 200);
  };

  const handleSaveStatus = async () => {
    if (!selectedAppeal) return;
    try {
      setSavingStatus(true);
      const payload = {
        status: (statusValue || "new").toLowerCase(),
      };
      const updatedReport = await toast.promise(
        updateSpellingReportApi(selectedAppeal.id, payload),
        {
          loading: "Saqlanmoqda...",
          success: "Holat yangilandi",
          error: (err) => err?.message || "Xatolik yuz berdi",
        }
      );
      setAppeals((prev) =>
        prev.map((ap) =>
          ap.id === selectedAppeal.id
            ? {
                ...ap,
                ...(updatedReport || {}),
                status: payload.status,
              }
            : ap
        )
      );
      closeModal();
    } catch (err) {
      if (err?.message) {
        toast.error(err.message);
      }
    } finally {
      setSavingStatus(false);
    }
  };

  // Pagination logic
  const total = appeals.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAppeals = appeals.slice(startIndex, endIndex);
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
          onClick={fetchAppeals}
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
            Imloviy xatoliklar bo'yichi murojaatlar
          </p>
        </div>
      </div>

      {/* Filters Row: Search (left) and Page Size (right) */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 sm:max-w-sm flex items-center gap-3">
          {/* Search can be added here if needed */}
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
        {appeals.length === 0 ? (
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
                      To'liq ism-familiya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Telefon raqami
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Matn parcha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Manba
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedAppeals.map((appeal) => (
                    <tr
                      key={appeal.id}
                      onClick={() => handleRowClick(appeal)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {appeal.is_anonymous
                          ? "Anonim"
                          : appeal.full_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {appeal.phone_number || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(appeal.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {truncateText(
                          appeal.text_snippet ||
                            appeal.description ||
                            appeal.message ||
                            "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400">
                        {appeal.source_url ? (
                          <a
                            href={appeal.source_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="underline"
                          >
                            Havola
                          </a>
                        ) : (
                          "-"
                        )}
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
      {isModalOpen && selectedAppeal && (
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
                      {selectedAppeal.is_anonymous
                        ? "Anonim"
                        : selectedAppeal.full_name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Telefon raqami
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedAppeal.phone_number ||
                        selectedAppeal.user?.phone_number ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Telegram foydalanuvchisi
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedAppeal.user?.username
                        ? `@${selectedAppeal.user.username}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Yuborilgan
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {formatDateTime(selectedAppeal.created_at)}
                    </p>
                  </div>
                </div>

                {selectedAppeal.text_snippet && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Matn parcha
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      {selectedAppeal.text_snippet}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Manba havola
                  </p>
                  {selectedAppeal.source_url ? (
                    <a
                      href={selectedAppeal.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 underline break-words"
                    >
                      {selectedAppeal.source_url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">-</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Tavsif
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                    {selectedAppeal.description || "-"}
                  </p>
                </div>

                {selectedAppeal.attachment && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Biriktirma
                    </p>
                    <a
                      href={selectedAppeal.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 underline"
                    >
                      Faylni ochish
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Status
                  </p>
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    disabled={savingStatus}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
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
                    "Saqlash"
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

export default ImloviyXatoliklarMurojaatlar;

