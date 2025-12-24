import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VacanciesTable from "../components/tables/VacanciesTable";
import QuickCreateVacancyModal from "../components/modals/QuickCreateVacancyModal";
import { getVacanciesApi, getVacancyByIdApi, updateVacancyApi, deleteVacancyApi } from "../utils/api";
import { latinToCyrillic } from "../utils/transliterate";
import toast from "react-hot-toast";

// Regions data with display names
const REGIONS = [
  { value: "toshkent", label: "Toshkent" },
  { value: "qashqadaryo", label: "Qashqadaryo" },
  { value: "samarqand", label: "Samarqand" },
  { value: "navoiy", label: "Navoiy" },
  { value: "andijon", label: "Andijon" },
  { value: "fargona", label: "Farg'ona" },
  { value: "namangan", label: "Namangan" },
  { value: "surxondaryo", label: "Surxondaryo" },
  { value: "sirdaryo", label: "Sirdaryo" },
  { value: "jizzax", label: "Jizzax" },
  { value: "buxoro", label: "Buxoro" },
  { value: "xorazm", label: "Xorazm" },
  { value: "qoraqalpogiston", label: "Qoraqalpog'iston Respublikasi" },
];

const RegionVacancies = () => {
  const { region_name } = useParams();
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  
  // View details modal
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTitleTab, setActiveTitleTab] = useState("uz");
  const [activeRegionTitleTab, setActiveRegionTitleTab] = useState("uz");
  const [activeRequirementsTab, setActiveRequirementsTab] = useState("uz");
  const [activeJobTasksTab, setActiveJobTasksTab] = useState("uz");
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title_uz: "",
    title_cr: "",
    title_ru: "",
    region_title_uz: "",
    region_title_cr: "",
    region_title_ru: "",
    requirements_uz: [{ task: "" }],
    requirements_cr: [{ task: "" }],
    requirements_ru: [{ task: "" }],
    job_tasks_uz: [{ task: "" }],
    job_tasks_cr: [{ task: "" }],
    job_tasks_ru: [{ task: "" }],
    application_deadline: "",
    test_scheduled_at: "",
    is_active: true,
    branch_type: "regional",
    region: region_name || "",
    lan_requirements_eng: "not_required",
    lan_requirements_ru: "not_required",
  });
  const [editManualEditFlags, setEditManualEditFlags] = useState({
    title_cr: false,
    region_title_cr: false,
    requirements_cr: {},
    job_tasks_cr: {},
  });
  const [editExpandedSections, setEditExpandedSections] = useState({
    requirements: false,
    job_tasks: false,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const region = REGIONS.find((r) => r.value === region_name);
  const regionLabel = region ? region.label : region_name;

  useEffect(() => {
    if (region_name) {
      fetchRegionalVacancies();
      document.title = `${regionLabel} - Hududiy vakansiyalar - Markaziy Bank Administratsiyasi`;
    }
  }, [region_name]);

  const fetchRegionalVacancies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVacanciesApi(null, {
        region: region_name,
        branch_type: "regional",
      });
      
      console.log("Regional vacancies API response:", data);
      
      // Handle paginated response structure: { count, next, previous, results: [...] }
      const vacanciesArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      
      setVacancies(vacanciesArray);
      setPage(1);
    } catch (error) {
      console.error("Error fetching regional vacancies:", error);
      setError(error.message);
      toast.error("Hududiy vakansiyalarni yuklashda xatolik yuz berdi");
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format datetime-local value with GMT+5 timezone
  const formatDateTimeWithTimezone = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    const [datePart, timePart] = datetimeLocal.split("T");
    return `${datePart}T${timePart}:00+05:00`;
  };

  // Helper function to convert ISO datetime to datetime-local format
  const isoToDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditVacancy = async (vacancyItem) => {
    try {
      setIsEditModalOpen(true);
      setEditLoading(true);
      // Fetch full vacancy details from API
      const fullVacancyData = await getVacancyByIdApi(vacancyItem.id);
      setEditingVacancy(fullVacancyData);
      
      // Convert ISO dates to datetime-local format
      setEditFormData({
        title_uz: fullVacancyData.title_uz || "",
        title_cr: fullVacancyData.title_cr || "",
        title_ru: fullVacancyData.title_ru || "",
        region_title_uz: fullVacancyData.region_title_uz || "",
        region_title_cr: fullVacancyData.region_title_cr || "",
        region_title_ru: fullVacancyData.region_title_ru || "",
        requirements_uz: Array.isArray(fullVacancyData.requirements_uz) && fullVacancyData.requirements_uz.length > 0
          ? fullVacancyData.requirements_uz
          : [{ task: "" }],
        requirements_cr: Array.isArray(fullVacancyData.requirements_cr) && fullVacancyData.requirements_cr.length > 0
          ? fullVacancyData.requirements_cr
          : [{ task: "" }],
        requirements_ru: Array.isArray(fullVacancyData.requirements_ru) && fullVacancyData.requirements_ru.length > 0
          ? fullVacancyData.requirements_ru
          : [{ task: "" }],
        job_tasks_uz: Array.isArray(fullVacancyData.job_tasks_uz) && fullVacancyData.job_tasks_uz.length > 0
          ? fullVacancyData.job_tasks_uz
          : [{ task: "" }],
        job_tasks_cr: Array.isArray(fullVacancyData.job_tasks_cr) && fullVacancyData.job_tasks_cr.length > 0
          ? fullVacancyData.job_tasks_cr
          : [{ task: "" }],
        job_tasks_ru: Array.isArray(fullVacancyData.job_tasks_ru) && fullVacancyData.job_tasks_ru.length > 0
          ? fullVacancyData.job_tasks_ru
          : [{ task: "" }],
        application_deadline: fullVacancyData.application_deadline 
          ? fullVacancyData.application_deadline.split("T")[0] 
          : "",
        test_scheduled_at: fullVacancyData.test_scheduled_at 
          ? isoToDateTimeLocal(fullVacancyData.test_scheduled_at) 
          : "",
        is_active: fullVacancyData.is_active ?? true,
        branch_type: fullVacancyData.branch_type || "regional",
        region: fullVacancyData.region || region_name || "",
        lan_requirements_eng: fullVacancyData.lan_requirements_eng || "not_required",
        lan_requirements_ru: fullVacancyData.lan_requirements_ru || "not_required",
      });
      setEditManualEditFlags({
        title_cr: false,
        region_title_cr: false,
        requirements_cr: {},
        job_tasks_cr: {},
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
    
    // Auto-transliterate title_uz to title_cr
    if (name === 'title_uz' && !editManualEditFlags.title_cr) {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
        title_cr: latinToCyrillic(value),
      }));
    } else if (name === 'region_title_uz' && !editManualEditFlags.region_title_cr) {
      // Auto-transliterate region_title_uz to region_title_cr
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
        region_title_cr: latinToCyrillic(value),
      }));
    } else {
      // If editing title_cr or region_title_cr, mark as manually edited
      if (name === 'title_cr') {
        setEditManualEditFlags((prev) => ({
          ...prev,
          title_cr: true,
        }));
      } else if (name === 'region_title_cr') {
        setEditManualEditFlags((prev) => ({
          ...prev,
          region_title_cr: true,
        }));
      }
      setEditFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleEditTaskChange = (type, lang, index, value) => {
    const fieldName = `${type}_${lang}`;
    const updated = [...editFormData[fieldName]];
    updated[index] = { task: value };
    
    // Auto-transliterate Uzbek Latin tasks to Cyrillic
    if (lang === 'uz') {
      const taskKey = `${type}_${index}`;
      const isManuallyEdited = editManualEditFlags[`${type}_cr`]?.[taskKey] || false;
      
      if (!isManuallyEdited) {
        const cyrillicFieldName = `${type}_cr`;
        const cyrillicTasks = [...editFormData[cyrillicFieldName]];
        // Ensure the array is long enough
        while (cyrillicTasks.length <= index) {
          cyrillicTasks.push({ task: "" });
        }
        cyrillicTasks[index] = { task: latinToCyrillic(value) };
        setEditFormData({ 
          ...editFormData, 
          [fieldName]: updated,
          [cyrillicFieldName]: cyrillicTasks,
        });
        return;
      }
    }
    
    // If Cyrillic task is being edited, mark as manually edited
    if (lang === 'cr') {
      const taskKey = `${type}_${index}`;
      setEditManualEditFlags((prev) => ({
        ...prev,
        [`${type}_cr`]: {
          ...(prev[`${type}_cr`] || {}),
          [taskKey]: true,
        },
      }));
    }
    
    setEditFormData({ ...editFormData, [fieldName]: updated });
  };

  const addEditTask = (type, lang) => {
    const fieldName = `${type}_${lang}`;
    setEditFormData({
      ...editFormData,
      [fieldName]: [...editFormData[fieldName], { task: "" }],
    });
  };

  const removeEditTask = (type, lang, index) => {
    const fieldName = `${type}_${lang}`;
    if (editFormData[fieldName].length <= 1) return;
    setEditFormData({
      ...editFormData,
      [fieldName]: editFormData[fieldName].filter((_, i) => i !== index),
    });
  };

  const toggleEditSection = (section) => {
    setEditExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    // Validate title
    if (!editFormData.title_uz.trim()) {
      toast.error("Vakansiya nomi (O'zbekcha) kiritilishi shart");
      return;
    }

    // Filter and validate requirements
    const filteredRequirementsUz = editFormData.requirements_uz.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredRequirementsCr = editFormData.requirements_cr.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredRequirementsRu = editFormData.requirements_ru.filter(
      (t) => (t.task || "").trim() !== ""
    );

    if (
      filteredRequirementsUz.length === 0 &&
      filteredRequirementsCr.length === 0 &&
      filteredRequirementsRu.length === 0
    ) {
      toast.error("Kamida bitta tilda talablar kiritilishi shart");
      return;
    }

    // Filter and validate job_tasks
    const filteredJobTasksUz = editFormData.job_tasks_uz.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredJobTasksCr = editFormData.job_tasks_cr.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredJobTasksRu = editFormData.job_tasks_ru.filter(
      (t) => (t.task || "").trim() !== ""
    );

    if (
      filteredJobTasksUz.length === 0 &&
      filteredJobTasksCr.length === 0 &&
      filteredJobTasksRu.length === 0
    ) {
      toast.error("Kamida bitta tilda ish vazifalari kiritilishi shart");
      return;
    }

    if (!editFormData.application_deadline) {
      toast.error("Ariza berish muddati kiritilishi shart");
      return;
    }

    try {
      setEditSaving(true);

      // Prepare payload for regional vacancy (no management_id)
      const payload = {
        title_uz: editFormData.title_uz.trim(),
        title_cr: editFormData.title_cr.trim(),
        title_ru: editFormData.title_ru.trim(),
        region_title_uz: editFormData.region_title_uz.trim(),
        region_title_cr: editFormData.region_title_cr.trim(),
        region_title_ru: editFormData.region_title_ru.trim(),
        requirements_uz: filteredRequirementsUz,
        requirements_cr: filteredRequirementsCr,
        requirements_ru: filteredRequirementsRu,
        job_tasks_uz: filteredJobTasksUz,
        job_tasks_cr: filteredJobTasksCr,
        job_tasks_ru: filteredJobTasksRu,
        lan_requirements_eng: editFormData.lan_requirements_eng,
        lan_requirements_ru: editFormData.lan_requirements_ru,
        is_active: editFormData.is_active,
        application_deadline: editFormData.application_deadline,
        branch_type: "regional",
        region: editFormData.region || region_name,
        test_scheduled_at: editFormData.test_scheduled_at
          ? formatDateTimeWithTimezone(editFormData.test_scheduled_at)
          : null,
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
        title_uz: "",
        title_cr: "",
        title_ru: "",
        region_title_uz: "",
        region_title_cr: "",
        region_title_ru: "",
        requirements_uz: [{ task: "" }],
        requirements_cr: [{ task: "" }],
        requirements_ru: [{ task: "" }],
        job_tasks_uz: [{ task: "" }],
        job_tasks_cr: [{ task: "" }],
        job_tasks_ru: [{ task: "" }],
        application_deadline: "",
        test_scheduled_at: "",
        is_active: true,
        branch_type: "regional",
        region: region_name || "",
        lan_requirements_eng: "not_required",
        lan_requirements_ru: "not_required",
      });
      setEditManualEditFlags({
        title_cr: false,
        region_title_cr: false,
        requirements_cr: {},
        job_tasks_cr: {},
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
    }, 300);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    const date = new Date(dateString);
    const months = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
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
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
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
          onClick={fetchRegionalVacancies}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Filter vacancies
  const q = query.trim().toLowerCase();
  const filtered = vacancies.filter((v) => {
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
          <button
            onClick={() => navigate("/region")}
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
              {regionLabel} - Vakansiyalar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Hududiy boshqarma vakansiyalari
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsQuickCreateOpen(true)}
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
          </button>
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Vakansiyalar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bu hudud uchun hozircha vakansiyalar mavjud emas.
          </p>
        </div>
      ) : (
        <>
          <VacanciesTable
            vacancies={paginated}
            onEdit={handleEditVacancy}
            onDelete={handleDeleteVacancy}
            onViewDetails={handleViewVacancyDetails}
            selectedIds={new Set()}
            hideDepartmentColumn={true}
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

      {/* Quick Create Vacancy Modal */}
      <QuickCreateVacancyModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={() => {
          setIsQuickCreateOpen(false);
          fetchRegionalVacancies();
        }}
        initialBranchType="regional"
        initialRegion={region_name}
      />

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
                        {/* Title with Tabs */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                              Vakansiya nomi
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setActiveTitleTab("uz")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeTitleTab === "uz"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                UZ
                              </button>
                              <button
                                onClick={() => setActiveTitleTab("cr")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeTitleTab === "cr"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                CR
                              </button>
                              <button
                                onClick={() => setActiveTitleTab("ru")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeTitleTab === "ru"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                RU
                              </button>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {activeTitleTab === "uz" && (selectedVacancy.title_uz || selectedVacancy.title || "Ma'lumot yo'q")}
                            {activeTitleTab === "cr" && (selectedVacancy.title_cr || "Ma'lumot yo'q")}
                            {activeTitleTab === "ru" && (selectedVacancy.title_ru || "Ma'lumot yo'q")}
                          </p>
                        </div>
                        {selectedVacancy.branch_type_display && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {selectedVacancy.branch_type_display}
                            {selectedVacancy.region && ` - ${REGIONS.find(r => r.value === selectedVacancy.region)?.label || selectedVacancy.region}`}
                          </p>
                        )}
                        {/* Region Title */}
                        {(selectedVacancy.region_title_uz || selectedVacancy.region_title_cr || selectedVacancy.region_title_ru) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                              Vakansiyaning to'liq nomi
                            </p>
                            <div className="flex space-x-2 mb-2">
                              <button
                                onClick={() => setActiveRegionTitleTab("uz")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeRegionTitleTab === "uz"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                UZ
                              </button>
                              <button
                                onClick={() => setActiveRegionTitleTab("cr")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeRegionTitleTab === "cr"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                CR
                              </button>
                              <button
                                onClick={() => setActiveRegionTitleTab("ru")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeRegionTitleTab === "ru"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                RU
                              </button>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                              {activeRegionTitleTab === "uz" && (selectedVacancy.region_title_uz || "Ma'lumot yo'q")}
                              {activeRegionTitleTab === "cr" && (selectedVacancy.region_title_cr || "Ma'lumot yo'q")}
                              {activeRegionTitleTab === "ru" && (selectedVacancy.region_title_ru || "Ma'lumot yo'q")}
                            </p>
                          </div>
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
                    <div className="space-y-4">
                      {/* Requirements with Tabs */}
                      {((selectedVacancy.requirements_uz && Array.isArray(selectedVacancy.requirements_uz) && selectedVacancy.requirements_uz.length > 0) ||
                        (selectedVacancy.requirements_cr && Array.isArray(selectedVacancy.requirements_cr) && selectedVacancy.requirements_cr.length > 0) ||
                        (selectedVacancy.requirements_ru && Array.isArray(selectedVacancy.requirements_ru) && selectedVacancy.requirements_ru.length > 0)) && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Talablar
                            </h5>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setActiveRequirementsTab("uz")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeRequirementsTab === "uz"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                UZ
                              </button>
                              <button
                                onClick={() => setActiveRequirementsTab("cr")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeRequirementsTab === "cr"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                CR
                              </button>
                              <button
                                onClick={() => setActiveRequirementsTab("ru")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeRequirementsTab === "ru"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                RU
                              </button>
                            </div>
                          </div>
                          <ul className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed list-disc list-inside space-y-1">
                            {activeRequirementsTab === "uz" && selectedVacancy.requirements_uz?.map((req, idx) => (
                              <li key={idx}>{req.task || req}</li>
                            ))}
                            {activeRequirementsTab === "cr" && selectedVacancy.requirements_cr?.map((req, idx) => (
                              <li key={idx}>{req.task || req}</li>
                            ))}
                            {activeRequirementsTab === "ru" && selectedVacancy.requirements_ru?.map((req, idx) => (
                              <li key={idx}>{req.task || req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Job Tasks with Tabs */}
                      {((selectedVacancy.job_tasks_uz && Array.isArray(selectedVacancy.job_tasks_uz) && selectedVacancy.job_tasks_uz.length > 0) ||
                        (selectedVacancy.job_tasks_cr && Array.isArray(selectedVacancy.job_tasks_cr) && selectedVacancy.job_tasks_cr.length > 0) ||
                        (selectedVacancy.job_tasks_ru && Array.isArray(selectedVacancy.job_tasks_ru) && selectedVacancy.job_tasks_ru.length > 0)) && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Ish vazifalari
                            </h5>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setActiveJobTasksTab("uz")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeJobTasksTab === "uz"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                UZ
                              </button>
                              <button
                                onClick={() => setActiveJobTasksTab("cr")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeJobTasksTab === "cr"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                CR
                              </button>
                              <button
                                onClick={() => setActiveJobTasksTab("ru")}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  activeJobTasksTab === "ru"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                RU
                              </button>
                            </div>
                          </div>
                          <ul className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed list-disc list-inside space-y-1">
                            {activeJobTasksTab === "uz" && selectedVacancy.job_tasks_uz?.map((task, idx) => (
                              <li key={idx}>{task.task || task}</li>
                            ))}
                            {activeJobTasksTab === "cr" && selectedVacancy.job_tasks_cr?.map((task, idx) => (
                              <li key={idx}>{task.task || task}</li>
                            ))}
                            {activeJobTasksTab === "ru" && selectedVacancy.job_tasks_ru?.map((task, idx) => (
                              <li key={idx}>{task.task || task}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Language Requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            Ingliz tili
                          </h5>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedVacancy.lan_requirements_eng === "not_required" 
                              ? "Talab qilinmaydi" 
                              : (selectedVacancy.lan_requirements_eng || "—")}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            Rus tili
                          </h5>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedVacancy.lan_requirements_ru === "not_required" 
                              ? "Talab qilinmaydi" 
                              : (selectedVacancy.lan_requirements_ru || "—")}
                          </p>
                        </div>
                      </div>
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
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
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
                      {/* Title - Multilingual */}
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Vakansiya nomi (3 tilda) *
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="edit_title_uz"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              O'zbekcha *
                            </label>
                            <input
                              type="text"
                              id="edit_title_uz"
                              name="title_uz"
                              value={editFormData.title_uz}
                              onChange={handleEditFormChange}
                              disabled={editSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                              placeholder="O'zbekcha nom"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="edit_title_cr"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              O'zbekcha (Kirill)
                            </label>
                            <input
                              type="text"
                              id="edit_title_cr"
                              name="title_cr"
                              value={editFormData.title_cr}
                              onChange={handleEditFormChange}
                              disabled={editSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                              placeholder="O'zbekcha (Kirill) nom"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="edit_title_ru"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Ruscha
                            </label>
                            <input
                              type="text"
                              id="edit_title_ru"
                              name="title_ru"
                              value={editFormData.title_ru}
                              onChange={handleEditFormChange}
                              disabled={editSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                              placeholder="Русское название"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Region Title - Multilingual */}
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Vakansiyaning to'liq nomi (3 tilda)
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="edit_region_title_uz"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              O'zbekcha
                            </label>
                            <input
                              type="text"
                              id="edit_region_title_uz"
                              name="region_title_uz"
                              value={editFormData.region_title_uz}
                              onChange={handleEditFormChange}
                              disabled={editSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                              placeholder="O'zbekcha to'liq nom"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="edit_region_title_cr"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              O'zbekcha (Kirill)
                            </label>
                            <input
                              type="text"
                              id="edit_region_title_cr"
                              name="region_title_cr"
                              value={editFormData.region_title_cr}
                              onChange={handleEditFormChange}
                              disabled={editSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                              placeholder="O'zbekcha (Kirill) to'liq nom"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="edit_region_title_ru"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Ruscha
                            </label>
                            <input
                              type="text"
                              id="edit_region_title_ru"
                              name="region_title_ru"
                              value={editFormData.region_title_ru}
                              onChange={handleEditFormChange}
                              disabled={editSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                              placeholder="Полное название вакансии"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Requirements - Multilingual with Accordion */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleEditSection('requirements')}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <label className="text-base font-semibold text-gray-900 dark:text-white">
                              Talablar *
                            </label>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500">
                              {editFormData.requirements_uz.length + editFormData.requirements_cr.length + editFormData.requirements_ru.length} ta
                            </span>
                          </div>
                          <svg
                            className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${editExpandedSections.requirements ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {editExpandedSections.requirements && (
                          <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {['uz', 'cr', 'ru'].map((lang) => {
                              const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                              const requirementsField = `requirements_${lang}`;
                              const requirements = editFormData[requirementsField] || [];
                              
                              return (
                                <div key={`edit_requirements_${lang}`} className="space-y-3">
                                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      {langNames[lang]} {lang === 'uz' && <span className="text-red-500">*</span>}
                                    </label>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                      {requirements.length} ta
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {requirements.map((req, index) => (
                                      <div
                                        key={index}
                                        className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                      >
                                        <div className="flex-shrink-0 mt-1">
                                          <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                            {index + 1}
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <textarea
                                            value={req.task}
                                            onChange={(e) =>
                                              handleEditTaskChange('requirements', lang, index, e.target.value)
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm transition-all"
                                            placeholder={`${langNames[lang]} talab ${index + 1}...`}
                                            disabled={editSaving}
                                          />
                                        </div>
                                        {requirements.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeEditTask('requirements', lang, index)}
                                            disabled={editSaving}
                                            className="flex-shrink-0 mt-1 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                            title="Talabni o'chirish"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => addEditTask('requirements', lang)}
                                      disabled={editSaving}
                                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                      <span className="flex items-center justify-center space-x-2">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>{langNames[lang]} talab qo'shish</span>
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Job Tasks - Multilingual with Accordion */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleEditSection('job_tasks')}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <label className="text-base font-semibold text-gray-900 dark:text-white">
                              Ish vazifalari *
                            </label>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500">
                              {editFormData.job_tasks_uz.length + editFormData.job_tasks_cr.length + editFormData.job_tasks_ru.length} ta
                            </span>
                          </div>
                          <svg
                            className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${editExpandedSections.job_tasks ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {editExpandedSections.job_tasks && (
                          <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {['uz', 'cr', 'ru'].map((lang) => {
                              const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                              const jobTasksField = `job_tasks_${lang}`;
                              const jobTasks = editFormData[jobTasksField] || [];
                              
                              return (
                                <div key={`edit_job_tasks_${lang}`} className="space-y-3">
                                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      {langNames[lang]} {lang === 'uz' && <span className="text-red-500">*</span>}
                                    </label>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                      {jobTasks.length} ta
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {jobTasks.map((task, index) => (
                                      <div
                                        key={index}
                                        className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors"
                                      >
                                        <div className="flex-shrink-0 mt-1">
                                          <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                            {index + 1}
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <textarea
                                            value={task.task}
                                            onChange={(e) =>
                                              handleEditTaskChange('job_tasks', lang, index, e.target.value)
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-all"
                                            placeholder={`${langNames[lang]} vazifa ${index + 1}...`}
                                            disabled={editSaving}
                                          />
                                        </div>
                                        {jobTasks.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeEditTask('job_tasks', lang, index)}
                                            disabled={editSaving}
                                            className="flex-shrink-0 mt-1 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                            title="Vazifani o'chirish"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => addEditTask('job_tasks', lang)}
                                      disabled={editSaving}
                                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                      <span className="flex items-center justify-center space-x-2">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>{langNames[lang]} vazifa qo'shish</span>
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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

                      {/* Region - read-only for regional vacancies */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hudud
                        </label>
                        <input
                          type="text"
                          value={REGIONS.find(r => r.value === editFormData.region)?.label || editFormData.region}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Hudud o'zgartirib bo'lmaydi
                        </p>
                      </div>

                      {/* Language Requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Talab qilinadigan ingliz tili
                          </label>
                          <select
                            name="lan_requirements_eng"
                            value={editFormData.lan_requirements_eng}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="not_required">Talab qilinmaydi</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Talab qilinadigan rus tili
                          </label>
                          <select
                            name="lan_requirements_ru"
                            value={editFormData.lan_requirements_ru}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="not_required">Talab qilinmaydi</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                          </select>
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
    </div>
  );
};

export default RegionVacancies;

