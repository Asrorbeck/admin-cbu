import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getApplicationsApi,
  getApplicationByIdApi,
  updateApplicationApi,
} from "../utils/api";
import toast from "react-hot-toast";

const Arizalar = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusValue, setStatusValue] = useState("pending");
  const [savingStatus, setSavingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
    document.title = "Arizalar - Markaziy Bank Administratsiyasi";
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const applicationsData = await getApplicationsApi();
      setApplications(applicationsData);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(error.message);
      toast.error("Arizalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    return new Date(dateString).toLocaleDateString("uz-UZ");
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "test_scheduled") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Qabul qilindi
        </span>
      );
    }
    if (s === "rejected_docs") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Rad etildi
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Kutilmoqda
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        Kutilmoqda
      </span>
    );
  };

  // Fuzzy duplicate detection (>=70% similar name AND same date_of_birth)
  const normalizeName = (name) =>
    (name || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const nameTokens = (name) => normalizeName(name).split(" ").filter(Boolean);

  const diceCoefficient = (a, b) => {
    const bigrams = (s) => {
      const n = s.length;
      if (n < 2) return new Map([[s, 1]]);
      const m = new Map();
      for (let i = 0; i < n - 1; i++) {
        const bg = s.slice(i, i + 2);
        m.set(bg, (m.get(bg) || 0) + 1);
      }
      return m;
    };
    const A = bigrams(normalizeName(a));
    const B = bigrams(normalizeName(b));
    let overlap = 0;
    A.forEach((count, bg) => {
      if (B.has(bg)) overlap += Math.min(count, B.get(bg));
    });
    const total =
      [...A.values()].reduce((s, v) => s + v, 0) +
      [...B.values()].reduce((s, v) => s + v, 0);
    return total === 0 ? 0 : (2 * overlap) / total;
  };

  const jaccardTokens = (a, b) => {
    const A = new Set(nameTokens(a));
    const B = new Set(nameTokens(b));
    if (A.size === 0 && B.size === 0) return 0;
    let inter = 0;
    A.forEach((t) => {
      if (B.has(t)) inter++;
    });
    const uni = A.size + B.size - inter;
    return uni === 0 ? 0 : inter / uni;
  };

  const nameSimilarity = (a, b) => {
    const sim1 = Math.max(diceCoefficient(a, b), jaccardTokens(a, b));
    const rev = (s) => nameTokens(s).reverse().join(" ");
    const sim2 = Math.max(diceCoefficient(a, rev(b)), jaccardTokens(a, rev(b)));
    return Math.max(sim1, sim2);
  };

  const duplicateGroups = (() => {
    const byDob = new Map();
    applications.forEach((a) => {
      const dob = a.data_of_birth || "";
      if (!byDob.has(dob)) byDob.set(dob, []);
      byDob.get(dob).push(a);
    });
    const groups = [];
    byDob.forEach((list) => {
      const local = [];
      list.forEach((item) => {
        let placed = false;
        for (const g of local) {
          if (
            g.some((m) => nameSimilarity(m.full_name, item.full_name) >= 0.7)
          ) {
            g.push(item);
            placed = true;
            break;
          }
        }
        if (!placed) local.push([item]);
      });
      local.filter((g) => g.length > 1).forEach((g) => groups.push(g));
    });
    return groups;
  })();

  const duplicateIds = new Set(duplicateGroups.flat().map((a) => a.id));
  const isDuplicate = (a) => duplicateIds.has(a.id);

  // Notify header and support opening duplicates modal
  useEffect(() => {
    const count = duplicateGroups.length;
    window.dispatchEvent(
      new CustomEvent("apps-duplicates", { detail: { has: count > 0, count } })
    );

    const openHandler = () => setDuplicatesOpen(true);
    window.addEventListener("open-duplicates-modal", openHandler);
    return () =>
      window.removeEventListener("open-duplicates-modal", openHandler);
  }, [duplicateGroups]);

  const [duplicatesOpen, setDuplicatesOpen] = useState(false);

  const handleViewDetails = async (applicationId) => {
    try {
      setIsModalOpen(true);
      setModalLoading(true);
      const fullData = await getApplicationByIdApi(applicationId);
      setSelectedApplication(fullData);
      setStatusValue((fullData?.status || "pending").toLowerCase());
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Ariza ma'lumotlarini yuklashda xatolik yuz berdi");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
  };

  const handleSaveStatus = async () => {
    if (!selectedApplication) return;
    try {
      setSavingStatus(true);
      const fullPayload = {
        user_id: selectedApplication.user_id,
        job: selectedApplication.job?.id || selectedApplication.job,
        full_name: selectedApplication.full_name,
        data_of_birth: selectedApplication.data_of_birth,
        phone: selectedApplication.phone,
        additional_information: selectedApplication.additional_information,
        graduations: selectedApplication.graduations || [],
        employments: selectedApplication.employments || [],
        languages: selectedApplication.languages || [],
        status: statusValue,
      };

      await toast.promise(
        updateApplicationApi(selectedApplication.id, fullPayload),
        {
          loading: "Saqlanmoqda...",
          success: "Holat muvaffaqiyatli yangilandi",
          error: (err) =>
            err?.message || "Holatni yangilashda xatolik yuz berdi",
        }
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApplication.id ? { ...a, status: statusValue } : a
        )
      );
      setSelectedApplication((prev) => ({ ...prev, status: statusValue }));
    } finally {
      setSavingStatus(false);
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
          onClick={fetchApplications}
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
          <button
            onClick={() => navigate(-1)}
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
              Ishga arizalar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Nomzodlardan kelgan arizalar ro'yxati
            </p>
          </div>
        </div>
      </div>

      {/* Duplicates alert (page-level) */}
      {duplicateGroups.length > 0 && (
        <div className="flex items-center justify-end -mt-2">
          <button
            type="button"
            onClick={() => setDuplicatesOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs sm:text-sm font-medium rounded-md hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
            title="Bir xillik aniqlanmoqda"
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
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            Bir xillik aniqlanmoqda
            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-amber-500 text-white text-[10px]">
              {duplicateGroups.length}
            </span>
          </button>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  T/r
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  To'liq ism
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tug'ilgan sana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ta'lim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Holati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((application, index) => (
                <tr
                  key={application.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {application.full_name}
                      </div>
                      {isDuplicate(application) && (
                        <span
                          title="Takror kirim: to'liq ism va tug'ilgan sana bir xil"
                          className="inline-flex items-center"
                        >
                          <svg
                            className="h-4 w-4 text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(application.data_of_birth)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {application.phone}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-300">
                      {application.graduations &&
                      application.graduations.length > 0 ? (
                        <div>
                          <p className="font-medium">
                            {application.graduations[0].university}
                          </p>
                          <p className="text-gray-500">
                            {application.graduations[0].degree}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-500">Ma'lumot yo'q</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(application.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Tafsilotlar"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duplicates Modal */}
      {duplicatesOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setDuplicatesOpen(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Takror arizalar
                  </h3>
                  <button
                    onClick={() => setDuplicatesOpen(false)}
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
              </div>
              <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                {duplicateGroups.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Takror arizalar topilmadi.
                  </p>
                ) : (
                  duplicateGroups.map((items, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-md p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {items[0]?.full_name} — {items[0]?.data_of_birth}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {items.length} ta ariza
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {items.slice(0, 2).map((a) => (
                          <div
                            key={a.id}
                            className="bg-gray-50 dark:bg-gray-700/40 rounded p-3 text-sm text-gray-800 dark:text-gray-200"
                          >
                            <div className="font-semibold">{a.full_name}</div>
                            <div className="text-xs text-gray-500">
                              {a.data_of_birth}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                              {a.phone}
                            </div>
                            <div className="mt-2">
                              <button
                                onClick={() => handleViewDetails(a.id)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Tafsilot
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setDuplicatesOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Empty State */}
      {applications.length === 0 && (
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
            Arizalar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha hech kim ishga ariza bermagan.
          </p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => closeModal()}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ariza tafsilotlari
                  </h3>
                  <button
                    onClick={() => closeModal()}
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

              <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                {modalLoading ? (
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
                ) : selectedApplication ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          To'liq ism
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedApplication.full_name}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Tug'ilgan sana
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedApplication.data_of_birth)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Telefon
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedApplication.phone}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Qo'shimcha ma'lumot
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedApplication.additional_information ||
                            "Ma'lumot yo'q"}
                        </p>
                      </div>
                    </div>

                    {/* Job Information */}
                    {selectedApplication.job && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ish o'rni
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedApplication.job.title || "Ma'lumot yo'q"}
                          {selectedApplication.job.management_details?.name && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {" "}
                              ({selectedApplication.job.management_details.name}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ta'lim
                      </h4>
                      {selectedApplication.graduations?.length ? (
                        <div className="space-y-3">
                          {selectedApplication.graduations.map((g) => (
                            <div
                              key={g.id}
                              className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40"
                            >
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {g.university} — {g.degree}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {g.specialization}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(g.date_from)} —{" "}
                                {formatDate(g.date_to)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ish tajribasi
                      </h4>
                      {selectedApplication.employments?.length ? (
                        <div className="space-y-3">
                          {selectedApplication.employments.map((e) => (
                            <div
                              key={e.id}
                              className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40"
                            >
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {e.organization_name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {e.position}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(e.date_from)} —{" "}
                                {formatDate(e.date_to)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tillar
                      </h4>
                      {selectedApplication.languages?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.languages.map((l) => (
                            <span
                              key={l.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {l.language_name} — {l.degree}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
                      )}
                    </div>

                    {/* Status Editor (placed after languages) */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Holatni o'zgartirish
                      </h4>
                      <div className="flex items-center gap-3">
                        <select
                          value={statusValue}
                          onChange={(e) => setStatusValue(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                        >
                          <option value="REVIEWING">Kutilmoqda</option>
                          <option value="TEST_SCHEDULED">Qabul qilindi</option>
                          <option value="REJECTED_DOCS">Rad etildi</option>
                        </select>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Joriy: {getStatusBadge(selectedApplication.status)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {savingStatus ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button
                  onClick={() => closeModal()}
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

export default Arizalar;
