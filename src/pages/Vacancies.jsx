import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VacanciesTable from "../components/tables/VacanciesTable";
import { getVacanciesApi, deleteVacancyApi, getVacancyByIdApi, updateVacancyApi } from "../utils/api";
import toast from "react-hot-toast";

const Vacancies = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    test_scheduled_at: "",
    application_deadline: "",
  });
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVacancies();
    document.title = "Vakansiyalar - Markaziy Bank Administratsiyasi";
  }, [page, pageSize]);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVacanciesApi();
      console.log("Vacancies API response:", data);
      
      // Handle paginated response structure: { count, next, previous, results: [...] }
      // or direct array response
      const vacanciesArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      const count = data?.count || vacanciesArray.length;
      
      setVacancies(vacanciesArray);
      setTotalCount(count);
      setPage(1);
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      setError(error.message);
      toast.error("Vakansiyalarni yuklashda xatolik yuz berdi");
      setVacancies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vacancyId) => {
    const tId = toast.loading("O'chirilmoqda...");
    try {
      await deleteVacancyApi(vacancyId);
      setVacancies((prev) => {
        const updated = prev.filter((v) => v.id !== vacancyId);
        const q = query.trim().toLowerCase();
        const filtered = updated.filter((v) => {
          if (!q) return true;
          const inTitle = v.title?.toLowerCase().includes(q);
          const inDesc = v.description?.toLowerCase().includes(q);
          return inTitle || inDesc;
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (page > totalPages) setPage(totalPages);
        return updated;
      });
      setTotalCount((prev) => prev - 1);
      toast.success("Vakansiya muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      toast.error(error.message || "Vakansiyani o'chirishda xatolik yuz berdi");
    } finally {
      toast.dismiss(tId);
    }
  };

  const handleViewDetails = async (vacancy) => {
    try {
      setIsModalOpen(true);
      setModalLoading(true);
      // Fetch full vacancy details from API
      const fullVacancyData = await getVacancyByIdApi(vacancy.id);
      setSelectedVacancy(fullVacancyData);
    } catch (error) {
      console.error("Error fetching vacancy details:", error);
      toast.error("Vakansiya ma'lumotlarini yuklashda xatolik");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedVacancy(null);
    }, 300); // Wait for modal close animation
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
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
    return `${day} ${month} ${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
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
  };

  const handleEdit = (vacancy) => {
    // Navigate to edit page if exists
    // For now, just show a message
    toast("Tahrirlash funksiyasi tez orada qo'shiladi", { icon: "ℹ️" });
  };

  const handleToggleAll = (checked, visibleIds) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleToggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkEdit = () => {
    if (selectedIds.size === 0) {
      toast.error("Iltimos, kamida bitta vakansiyani tanlang");
      return;
    }
    setIsBulkEditOpen(true);
    setBulkEditData({
      test_scheduled_at: "",
      application_deadline: "",
    });
  };

  const handleBulkEditSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedIds.size === 0) {
      toast.error("Iltimos, kamida bitta vakansiyani tanlang");
      return;
    }

    // At least one field should be filled
    if (!bulkEditData.test_scheduled_at && !bulkEditData.application_deadline) {
      toast.error("Iltimos, kamida bitta maydonni to'ldiring");
      return;
    }

    try {
      setBulkEditLoading(true);
      const selectedVacancies = vacancies.filter((v) => selectedIds.has(v.id));
      
      // Format test_scheduled_at with timezone if provided
      let formattedTestScheduledAt = null;
      if (bulkEditData.test_scheduled_at) {
        const [datePart, timePart] = bulkEditData.test_scheduled_at.split("T");
        formattedTestScheduledAt = `${datePart}T${timePart}:00+05:00`;
      }

      await toast.promise(
        Promise.all(
          selectedVacancies.map(async (vacancy) => {
            // Get full vacancy data first
            const fullVacancy = await getVacancyByIdApi(vacancy.id);
            
            // Prepare update payload - only update provided fields
            const updatePayload = {
              title: fullVacancy.title,
              description: fullVacancy.description || "",
              requirements: fullVacancy.requirements || "",
              job_tasks: fullVacancy.job_tasks || "",
              is_active: fullVacancy.is_active ?? true,
              application_deadline: bulkEditData.application_deadline || fullVacancy.application_deadline,
              test_scheduled_at: formattedTestScheduledAt || fullVacancy.test_scheduled_at,
              management_id: fullVacancy.management_details?.id || fullVacancy.management,
            };

            return updateVacancyApi(vacancy.id, updatePayload);
          })
        ),
        {
          loading: "Yangilanmoqda...",
          success: `${selectedIds.size} ta vakansiya muvaffaqiyatli yangilandi`,
          error: (err) => err?.message || "Vakansiyalarni yangilashda xatolik yuz berdi",
        }
      );

      // Refresh vacancies list
      await fetchVacancies();
      setSelectedIds(new Set());
      setIsBulkEditOpen(false);
      setBulkEditData({
        test_scheduled_at: "",
        application_deadline: "",
      });
    } catch (error) {
      console.error("Error bulk updating vacancies:", error);
    } finally {
      setBulkEditLoading(false);
    }
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
          onClick={fetchVacancies}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Filter vacancies
  const safeVacancies = Array.isArray(vacancies) ? vacancies : [];
  const q = query.trim().toLowerCase();
  const filtered = safeVacancies.filter((v) => {
    if (!q) return true;
    const inTitle = v.title?.toLowerCase().includes(q);
    const inDesc = v.description?.toLowerCase().includes(q);
    const inManagement = v.management_details?.name?.toLowerCase().includes(q);
    return inTitle || inDesc || inManagement;
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
              Vakansiyalar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Barcha vakansiyalarni ko'rish va boshqarish
            </p>
          </div>
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
              placeholder="Qidirish: nomi, tavsifi yoki boshqarma..."
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
      {!Array.isArray(vacancies) || vacancies.length === 0 ? (
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Vakansiyalar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha vakansiyalar mavjud emas.
          </p>
        </div>
      ) : (
        <>
          {/* Bulk toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md px-4 py-3">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                Tanlangan: {selectedIds.size} ta vakansiya
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkEdit}
                  className="px-3 py-1.5 text-sm text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tahrirlash
                </button>
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                    toast.success("Tanlov bekor qilindi");
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          )}

          <VacanciesTable
            vacancies={paginated}
            managementId={null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            selectedIds={selectedIds}
            onToggleAll={(checked) => handleToggleAll(checked, paginated.map((v) => v.id))}
            onToggleOne={handleToggleOne}
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
      )}

      {/* Vacancy Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={closeModal}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vakansiya tafsilotlari
                </h3>
                <button
                  onClick={closeModal}
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
                {modalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="animate-spin h-6 w-6 text-blue-600"
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
                ) : selectedVacancy ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Vakansiya nomi
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedVacancy.title}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Holati
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedVacancy.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Faol
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Nofaol
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Boshqarma
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedVacancy.management_details?.name || "Ma'lumot yo'q"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Filial turi
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedVacancy.branch_type_display || selectedVacancy.branch_type || "Ma'lumot yo'q"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Test topshirish sanasi
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDateTime(selectedVacancy.test_scheduled_at)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Qabul sanasi
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedVacancy.application_deadline)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Tavsif
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedVacancy.description || "Ma'lumot yo'q"}
                      </p>
                    </div>
                    {selectedVacancy.requirements && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Talablar
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedVacancy.requirements}
                        </p>
                      </div>
                    )}
                    {selectedVacancy.job_tasks && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Vazifalar
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedVacancy.job_tasks}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Yaratilgan sana
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDateTime(selectedVacancy.created_at)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ma'lumotlar topilmadi
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => !bulkEditLoading && setIsBulkEditOpen(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vakansiyalarni tahrirlash ({selectedIds.size} ta)
                </h3>
                <button
                  onClick={() => !bulkEditLoading && setIsBulkEditOpen(false)}
                  disabled={bulkEditLoading}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
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
              <form onSubmit={handleBulkEditSubmit}>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Faqat to'ldirilgan maydonlar yangilanadi. Bo'sh qoldirilgan maydonlar o'zgartirilmaydi.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test topshirish sanasi va vaqti
                    </label>
                    <input
                      type="datetime-local"
                      value={bulkEditData.test_scheduled_at}
                      onChange={(e) =>
                        setBulkEditData((prev) => ({
                          ...prev,
                          test_scheduled_at: e.target.value,
                        }))
                      }
                      disabled={bulkEditLoading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Qabul sanasi
                    </label>
                    <input
                      type="date"
                      value={bulkEditData.application_deadline}
                      onChange={(e) =>
                        setBulkEditData((prev) => ({
                          ...prev,
                          application_deadline: e.target.value,
                        }))
                      }
                      disabled={bulkEditLoading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBulkEditOpen(false)}
                    disabled={bulkEditLoading}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={bulkEditLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {bulkEditLoading ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vacancies;

