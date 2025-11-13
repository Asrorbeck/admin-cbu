import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import EditManagementModal from "../components/modals/EditManagementModal";
import VacanciesTable from "../components/tables/VacanciesTable";
import {
  getManagementByIdApi,
  getVacanciesApi,
  getVacancyByIdApi,
  updateVacancyApi,
  deleteVacancyApi,
} from "../utils/api";
import toast from "react-hot-toast";

const ManagementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [management, setManagement] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isMgmtEditOpen, setIsMgmtEditOpen] = useState(false);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    job_tasks: "",
    application_deadline: "",
    test_scheduled_at: "",
    is_active: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Helper function to format datetime-local value with GMT+5 timezone
  const formatDateTimeWithTimezone = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // Convert to ISO format with GMT+5 offset: "YYYY-MM-DDTHH:mm:ss+05:00"
    const [datePart, timePart] = datetimeLocal.split("T");
    return `${datePart}T${timePart}:00+05:00`;
  };

  useEffect(() => {
    fetchManagementAndVacancies();
    document.title = "Boshqarma tafsilotlari - Markaziy Bank Administratsiyasi";
  }, [id]);

  const fetchManagementAndVacancies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch management data
      const managementData = await getManagementByIdApi(id);
      setManagement(managementData);

      // Try to fetch vacancies data filtered by management ID
      try {
        const vacanciesData = await getVacanciesApi(id);
        setVacancies(vacanciesData);
      } catch (vacancyError) {
        console.warn("Vacancies API not available:", vacancyError);
        // If vacancies API fails, just set empty array and continue
        setVacancies([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
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
          onClick={fetchManagementAndVacancies}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (!management) {
    navigate("/departments");
    return null;
  }

  const handleEditVacancy = async (vacancyItem) => {
    try {
      setIsEditModalOpen(true);
      setEditLoading(true);

      // Fetch full vacancy details from API
      const fullVacancyData = await getVacancyByIdApi(vacancyItem.id);
      setEditingVacancy(fullVacancyData);

      // Set form data
      // Convert ISO datetime to datetime-local format if exists
      let testScheduledAtValue = "";
      if (fullVacancyData.test_scheduled_at) {
        const date = new Date(fullVacancyData.test_scheduled_at);
        // Convert to local datetime string in format YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        testScheduledAtValue = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setEditFormData({
        title: fullVacancyData.title || "",
        description: fullVacancyData.description || "",
        requirements: fullVacancyData.requirements || "",
        job_tasks: fullVacancyData.job_tasks || "",
        application_deadline: fullVacancyData.application_deadline || "",
        test_scheduled_at: testScheduledAtValue,
        is_active: fullVacancyData.is_active ?? true,
      });
    } catch (error) {
      console.error("Error fetching vacancy details:", error);
      toast.error("Vakansiya ma'lumotlarini yuklashda xatolik");
      setIsEditModalOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.title || !editFormData.application_deadline) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      setEditSaving(true);

      // Prepare payload with management_id
      const payload = {
        ...editFormData,
        management_id: editingVacancy.management_details?.id || parseInt(id),
        // Convert datetime-local to ISO format with GMT+5 timezone if exists
        ...(editFormData.test_scheduled_at && {
          test_scheduled_at: formatDateTimeWithTimezone(
            editFormData.test_scheduled_at
          ),
        }),
      };

      // Update vacancy via API
      const updatedVacancy = await updateVacancyApi(editingVacancy.id, payload);

      // Update vacancies list
      setVacancies((prev) =>
        prev.map((v) => (v.id === editingVacancy.id ? updatedVacancy : v))
      );

      toast.success("Vakansiya muvaffaqiyatli yangilandi");
      closeEditModal();
    } catch (error) {
      console.error("Error updating vacancy:", error);
      toast.error("Vakansiyani yangilashda xatolik yuz berdi");
    } finally {
      setEditSaving(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setEditingVacancy(null);
      setEditFormData({
        title: "",
        description: "",
        requirements: "",
        job_tasks: "",
        application_deadline: "",
        test_scheduled_at: "",
        is_active: true,
      });
    }, 300);
  };

  const handleDeleteVacancy = async (vacancyId) => {
    const tId = toast.loading("O'chirilmoqda...");
    try {
      await deleteVacancyApi(vacancyId);
      setVacancies((prev) => prev.filter((item) => item.id !== vacancyId));
      toast.success("Vakansiya muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      toast.error(error.message || "Vakansiyani o'chirishda xatolik yuz berdi");
    } finally {
      toast.dismiss(tId);
    }
  };

  const handleViewVacancyDetails = async (vacancy) => {
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
              Boshqarma: {management.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Boshqarma tafsilotlari va ma'lumotlari
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Edit Management Button - styled like DepartmentDetails */}
          <button
            type="button"
            onClick={() => setIsMgmtEditOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Tahrirlash
          </button>
        </div>
      </div>

      {/* Management Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* Management Name */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Boshqarma nomi:
            </h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {management.name}
            </p>
          </div>

          {/* Management Functions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Boshqarma vazifalari:
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {management.management_functions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Data Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vakansiyalar
          </h2>
          <div className="mt-2 sm:mt-0">
            <Link
              to={`/management/${id}/new-vacancy`}
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
              Yangi vakansiya qo'shish
            </Link>
          </div>
        </div>

        {vacancies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                  strokeWidth={1.8}
                  d="M8.25 6.75V6A2.25 2.25 0 0 1 10.5 3.75h3a2.25 2.25 0 0 1 2.25 2.25v.75m-9.75 0h12.75m-14.25 0h15.75v10.5A2.25 2.25 0 0 1 19.5 19.5H6A2.25 2.25 0 0 1 3.75 17.25V6.75z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Vakansiyalar yo'q
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Bu boshqarma uchun hozircha vakansiyalar mavjud emas.
              </p>
            </div>
          </div>
        ) : (
          <VacanciesTable
            vacancies={vacancies}
            managementId={id}
            onEdit={handleEditVacancy}
            onDelete={handleDeleteVacancy}
            onViewDetails={handleViewVacancyDetails}
          />
        )}
      </div>

      {/* Vacancy Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={closeModal}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Vakansiya tafsilotlari
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
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
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
                ) : selectedVacancy ? (
                  <>
                    {/* Title and Status */}
                    <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedVacancy.title}
                        </h4>
                        {selectedVacancy.management_details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {selectedVacancy.management_details.name}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {selectedVacancy.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                            Nofaol
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Description */}
                      <div className="md:col-span-2">
                        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Tavsif
                        </h5>
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          {selectedVacancy.description || "Ma'lumot yo'q"}
                        </p>
                      </div>

                      {/* Requirements */}
                      {selectedVacancy.requirements && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Talablar
                          </h5>
                          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                            {selectedVacancy.requirements}
                          </p>
                        </div>
                      )}

                      {/* Job Tasks */}
                      {selectedVacancy.job_tasks && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Ish vazifalari
                          </h5>
                          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                            {selectedVacancy.job_tasks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Ariza muddati:</span>{" "}
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {formatDate(selectedVacancy.application_deadline)}
                        </span>
                      </div>
                      {selectedVacancy.test_scheduled_at && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">
                            Test bo'lish sanasi va vaqti:
                          </span>{" "}
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {formatDateTime(selectedVacancy.test_scheduled_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vacancy Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={closeEditModal}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Vakansiyani tahrirlash
                  </h3>
                  <button
                    onClick={closeEditModal}
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

              {/* Content */}
              <form onSubmit={handleEditFormSubmit}>
                <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {editLoading ? (
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
                  ) : editingVacancy ? (
                    <>
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Vakansiya nomi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editFormData.title}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Vakansiya nomini kiriting"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tavsif
                        </label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditFormChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Vakansiya tavsifini kiriting"
                        />
                      </div>

                      {/* Requirements and Job Tasks - 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Requirements */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Talablar
                          </label>
                          <textarea
                            name="requirements"
                            value={editFormData.requirements}
                            onChange={handleEditFormChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Talablarni kiriting"
                          />
                        </div>

                        {/* Job Tasks */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ish vazifalari
                          </label>
                          <textarea
                            name="job_tasks"
                            value={editFormData.job_tasks}
                            onChange={handleEditFormChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ish vazifalarini kiriting"
                          />
                        </div>
                      </div>

                      {/* Application Deadline and Test Scheduled At - 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Application Deadline */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ariza topshirish muddati{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="application_deadline"
                            value={editFormData.application_deadline}
                            onChange={handleEditFormChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Test Scheduled At */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Test bo'lish sanasi va vaqti
                          </label>
                          <input
                            type="datetime-local"
                            name="test_scheduled_at"
                            value={editFormData.test_scheduled_at}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Is Active */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          id="is_active_edit"
                          checked={editFormData.is_active}
                          onChange={handleEditFormChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="is_active_edit"
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          Vakansiya faol
                        </label>
                      </div>

                      {/* Management Info (read-only) */}
                      {editingVacancy.management_details && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Boshqarma
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {editingVacancy.management_details.name}
                          </p>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editSaving}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving || editLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {editSaving ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        <span>Saqlanmoqda...</span>
                      </>
                    ) : (
                      <span>Saqlash</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Management Modal (like DepartmentDetails) */}
      <EditManagementModal
        isOpen={isMgmtEditOpen}
        onClose={() => setIsMgmtEditOpen(false)}
        management={{
          id: management.id,
          name: management.name,
          management_functions: management.management_functions,
          department:
            management.department || management.department_id || undefined,
        }}
        onSuccess={(updated) => {
          setManagement((prev) => ({
            ...prev,
            name: updated.name ?? prev.name,
            management_functions:
              updated.management_functions ?? prev.management_functions,
          }));
          setIsMgmtEditOpen(false);
        }}
      />
    </div>
  );
};

export default ManagementDetails;
