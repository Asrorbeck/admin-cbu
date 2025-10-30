import { useState, useEffect } from "react";
import { getAppealsApi, updateAppealApi } from "../utils/api";
import toast from "react-hot-toast";

const Murojaatlar = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Murojaatlar bo'limi - Markaziy Bank Administratsiyasi";
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppealsApi();
      setAppeals(Array.isArray(data) ? data : []);
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
    if (v === "new")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Yangi
        </span>
      );
    if (v === "accepted")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Qabul qilindi
        </span>
      );
    if (v === "declined")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Rad etildi
        </span>
      );
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        Kutilmoqda
      </span>
    );
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [statusValue, setStatusValue] = useState("new");
  const [savingStatus, setSavingStatus] = useState(false);

  const totalCount = appeals.length;
  const newCount = appeals.filter(
    (a) => (a.status || "").toLowerCase() === "new"
  ).length;
  const answeredCount = appeals.filter(
    (a) => (a.status || "").toLowerCase() === "accepted"
  ).length;

  const handleRowClick = (a) => {
    setSelectedAppeal(a);
    setStatusValue(((a.status || "new") + "").toLowerCase());
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAppeal(null), 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Murojaatlar bo'limi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Fuqarolar va tashkilotlardan kelgan murojaatlar
          </p>
        </div>
      </div>

      {/* Stats above table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Jami murojaatlar
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Yangi
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {newCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Javob berilgan
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {answeredCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-0">
        {loading ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-8 w-8 animate-spin text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Xatolik
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {error}
            </p>
            <button
              onClick={fetchAppeals}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Qayta urinish
            </button>
          </div>
        ) : appeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Murojaatlar yo'q
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ism
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mavzu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Yuborilgan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Holati
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {appeals.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => {
                      setSelectedAppeal(a);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {a.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {a.is_anonymous ? "Anonim" : a.full_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {a.phone_number || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {a.email || "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate"
                      title={a.subject}
                    >
                      {a.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDateTime(a.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(a.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedAppeal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Murojaat tafsilotlari
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedAppeal.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Holati
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <select
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="new">Yangi</option>
                        <option value="accepted">Qabul qilindi</option>
                        <option value="declined">Rad etildi</option>
                      </select>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Joriy: {getStatusBadge(selectedAppeal.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ism
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedAppeal.is_anonymous
                        ? "Anonim"
                        : selectedAppeal.full_name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Telefon
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedAppeal.phone_number || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedAppeal.email || "-"}
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
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Mavzu
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedAppeal.subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Xabar
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                    {selectedAppeal.message}
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
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={savingStatus}
                  onClick={async () => {
                    if (!selectedAppeal) return;
                    try {
                      setSavingStatus(true);
                      const payload = {
                        user_id: selectedAppeal.user_id,
                        is_anonymous: selectedAppeal.is_anonymous,
                        full_name: selectedAppeal.full_name,
                        phone_number: selectedAppeal.phone_number,
                        email: selectedAppeal.email,
                        subject: selectedAppeal.subject,
                        message: selectedAppeal.message,
                        attachment: selectedAppeal.attachment,
                        created_at: selectedAppeal.created_at,
                        status: statusValue.toUpperCase(),
                      };
                      await toast.promise(
                        updateAppealApi(selectedAppeal.id, payload),
                        {
                          loading: "Saqlanmoqda...",
                          success: "Holat yangilandi",
                          error: (err) => err?.message || "Xatolik yuz berdi",
                        }
                      );
                      setAppeals((prev) =>
                        prev.map((ap) =>
                          ap.id === selectedAppeal.id
                            ? { ...ap, status: payload.status }
                            : ap
                        )
                      );
                      setSelectedAppeal((p) => ({
                        ...p,
                        status: payload.status,
                      }));
                    } catch {
                    } finally {
                      setSavingStatus(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  {savingStatus ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
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

export default Murojaatlar;
