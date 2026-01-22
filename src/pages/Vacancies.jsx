import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VacanciesTable from "../components/tables/VacanciesTable";
import { getVacanciesApi, deleteVacancyApi, getVacancyByIdApi, updateVacancyApi, getTestsApi } from "../utils/api";
import { latinToCyrillic } from "../utils/transliterate";
import { getStaticRequirementsAsObjects, mergeStaticRequirements } from "../utils/staticRequirements";
import toast from "react-hot-toast";

const Vacancies = () => {
  // Get static requirements
  const staticRequirements = getStaticRequirementsAsObjects();
  
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
  
  // View modal tabs
  const [activeTitleTab, setActiveTitleTab] = useState("uz");
  const [activeRequirementsTab, setActiveRequirementsTab] = useState("uz");
  const [activeJobTasksTab, setActiveJobTasksTab] = useState("uz");
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title_uz: "",
    title_cr: "",
    title_ru: "",
    requirements_uz: [...staticRequirements.uz, { task: "" }],
    requirements_cr: [...staticRequirements.cr, { task: "" }],
    requirements_ru: [...staticRequirements.ru, { task: "" }],
    job_tasks_uz: [{ task: "" }],
    job_tasks_cr: [{ task: "" }],
    job_tasks_ru: [{ task: "" }],
    application_deadline: "",
    test_scheduled_at: "",
    is_active: true,
    branch_type: "",
    region: "",
    lan_requirements_eng: "not_required",
    lan_requirements_ru: "not_required",
    test_id: "",
    quantity: "",
  });
  const [editManualEditFlags, setEditManualEditFlags] = useState({
    title_cr: false,
    requirements_cr: {},
    job_tasks_cr: {},
  });
  const [editExpandedSections, setEditExpandedSections] = useState({
    requirements: false,
    job_tasks: false,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchVacancies();
    fetchTests();
    document.title = "Vakansiyalar - Markaziy Bank Administratsiyasi";
  }, [page, pageSize]);

  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      const data = await getTestsApi();
      // Handle paginated response structure: { count, next, previous, results: [...] }
      // or direct array response
      const testsArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      setTests(testsArray);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Testlarni yuklashda xatolik yuz berdi");
      setTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

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
          const inTitle = (v.title_uz || v.title || "")?.toLowerCase().includes(q);
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

  // Helper function to format datetime-local value with GMT+5 timezone
  const formatDateTimeWithTimezone = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // Convert to ISO format with GMT+5 offset: "YYYY-MM-DDTHH:mm:ss+05:00"
    const [datePart, timePart] = datetimeLocal.split("T");
    return `${datePart}T${timePart}:00+05:00`;
  };

  const handleEdit = async (vacancy) => {
    try {
      setIsEditModalOpen(true);
      setEditLoading(true);

      // Fetch full vacancy details from API
      const fullVacancyData = await getVacancyByIdApi(vacancy.id);
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

      // Initialize form data with new structure
      setEditFormData({
        title_uz: fullVacancyData.title_uz || "",
        title_cr: fullVacancyData.title_cr || "",
        title_ru: fullVacancyData.title_ru || "",
        requirements_uz: mergeStaticRequirements(fullVacancyData.requirements_uz, "uz"),
        requirements_cr: mergeStaticRequirements(fullVacancyData.requirements_cr, "cr"),
        requirements_ru: mergeStaticRequirements(fullVacancyData.requirements_ru, "ru"),
        job_tasks_uz: Array.isArray(fullVacancyData.job_tasks_uz) && fullVacancyData.job_tasks_uz.length > 0
          ? fullVacancyData.job_tasks_uz
          : [{ task: "" }],
        job_tasks_cr: Array.isArray(fullVacancyData.job_tasks_cr) && fullVacancyData.job_tasks_cr.length > 0
          ? fullVacancyData.job_tasks_cr
          : [{ task: "" }],
        job_tasks_ru: Array.isArray(fullVacancyData.job_tasks_ru) && fullVacancyData.job_tasks_ru.length > 0
          ? fullVacancyData.job_tasks_ru
          : [{ task: "" }],
        application_deadline: fullVacancyData.application_deadline || "",
        test_scheduled_at: testScheduledAtValue,
        is_active: fullVacancyData.is_active ?? true,
        branch_type: fullVacancyData.branch_type || "",
        region: fullVacancyData.region || "",
        lan_requirements_eng: fullVacancyData.lan_requirements_eng || "not_required",
        lan_requirements_ru: fullVacancyData.lan_requirements_ru || "not_required",
        test_id: fullVacancyData.tests && fullVacancyData.tests.length > 0 ? String(fullVacancyData.tests[0].id) : "",
        quantity: fullVacancyData.quantity ? String(fullVacancyData.quantity) : "1",
      });
      
      // Reset manual edit flags
      setEditManualEditFlags({
        title_cr: false,
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
    } else {
      // If editing title_cr, mark as manually edited
      if (name === 'title_cr') {
        setEditManualEditFlags((prev) => ({
          ...prev,
          title_cr: true,
        }));
      }
      setEditFormData((prev) => {
        const newData = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };
        // If branch_type changes to "central", reset region to empty
        if (name === "branch_type" && value === "central") {
          newData.region = "";
        }
        // Handle number input for quantity
        if (name === "quantity") {
          newData.quantity = value === "" ? "1" : isNaN(parseInt(value, 10)) ? "1" : value;
        }
        return newData;
      });
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
      toast.error("Ariza topshirish muddati kiritilishi shart");
      return;
    }

    try {
      setEditSaving(true);

      // Prepare payload with new structure
      const payload = {
        title_uz: editFormData.title_uz.trim(),
        title_cr: editFormData.title_cr.trim(),
        title_ru: editFormData.title_ru.trim(),
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
        test_scheduled_at: editFormData.test_scheduled_at
          ? formatDateTimeWithTimezone(editFormData.test_scheduled_at)
          : null,
        ...(editFormData.test_id && {
          test_ids: [parseInt(editFormData.test_id)],
        }),
        quantity: editFormData.quantity && editFormData.quantity !== "" && !isNaN(parseInt(editFormData.quantity, 10))
          ? parseInt(editFormData.quantity, 10)
          : 1,
        management_id: editingVacancy.management_details?.id || editingVacancy.management,
        branch_type: editFormData.branch_type,
        region: editFormData.branch_type === "central" ? null : editFormData.region,
      };

      // Update vacancy via API
      const updatedVacancy = await updateVacancyApi(editingVacancy.id, payload);

      // Update vacancies list
      setVacancies((prev) =>
        prev.map((v) => (v.id === editingVacancy.id ? updatedVacancy : v))
      );

      toast.success("Vakansiya muvaffaqiyatli yangilandi");
      closeEditModal();
      
      // Refresh the list to ensure consistency
      await fetchVacancies();
    } catch (error) {
      console.error("Error updating vacancy:", error);
      toast.error(error.message || "Vakansiyani yangilashda xatolik yuz berdi");
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
        requirements_uz: [...staticRequirements.uz, { task: "" }],
        requirements_cr: [...staticRequirements.cr, { task: "" }],
        requirements_ru: [...staticRequirements.ru, { task: "" }],
        job_tasks_uz: [{ task: "" }],
        job_tasks_cr: [{ task: "" }],
        job_tasks_ru: [{ task: "" }],
        application_deadline: "",
        test_scheduled_at: "",
        is_active: true,
        branch_type: "",
        region: "",
        lan_requirements_eng: "not_required",
        lan_requirements_ru: "not_required",
        test_id: "",
        quantity: "",
      });
      setEditManualEditFlags({
        title_cr: false,
        requirements_cr: {},
        job_tasks_cr: {},
      });
    }, 300);
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
            
            // Prepare update payload with new structure - only update provided fields
            const updatePayload = {
              title_uz: fullVacancy.title_uz || fullVacancy.title || "",
              title_cr: fullVacancy.title_cr || "",
              title_ru: fullVacancy.title_ru || "",
              requirements_uz: Array.isArray(fullVacancy.requirements_uz) && fullVacancy.requirements_uz.length > 0
                ? fullVacancy.requirements_uz
                : [],
              requirements_cr: Array.isArray(fullVacancy.requirements_cr) && fullVacancy.requirements_cr.length > 0
                ? fullVacancy.requirements_cr
                : [],
              requirements_ru: Array.isArray(fullVacancy.requirements_ru) && fullVacancy.requirements_ru.length > 0
                ? fullVacancy.requirements_ru
                : [],
              job_tasks_uz: Array.isArray(fullVacancy.job_tasks_uz) && fullVacancy.job_tasks_uz.length > 0
                ? fullVacancy.job_tasks_uz
                : [],
              job_tasks_cr: Array.isArray(fullVacancy.job_tasks_cr) && fullVacancy.job_tasks_cr.length > 0
                ? fullVacancy.job_tasks_cr
                : [],
              job_tasks_ru: Array.isArray(fullVacancy.job_tasks_ru) && fullVacancy.job_tasks_ru.length > 0
                ? fullVacancy.job_tasks_ru
                : [],
              lan_requirements_eng: fullVacancy.lan_requirements_eng || "not_required",
              lan_requirements_ru: fullVacancy.lan_requirements_ru || "not_required",
              is_active: fullVacancy.is_active ?? true,
              application_deadline: bulkEditData.application_deadline || fullVacancy.application_deadline,
              test_scheduled_at: formattedTestScheduledAt || fullVacancy.test_scheduled_at,
              management_id: fullVacancy.management_details?.id || fullVacancy.management || fullVacancy.management_id,
              branch_type: fullVacancy.branch_type || "central",
              region: fullVacancy.branch_type === "central" ? null : (fullVacancy.region || null),
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
    const inTitle = (v.title_uz || v.title || "")?.toLowerCase().includes(q);
    const inDesc = v.description?.toLowerCase().includes(q);
    const inManagement = (v.management_details?.name_uz || v.management_details?.name || "")?.toLowerCase().includes(q);
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
                        {selectedVacancy.management_details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {selectedVacancy.management_details.name_uz || selectedVacancy.management_details.name || "Noma'lum"}
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
                    disabled={editSaving}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
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
                            Test
                          </label>
                          {loadingTests ? (
                            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400">
                              Testlar yuklanmoqda...
                            </div>
                          ) : (
                            <select
                              name="test_id"
                              value={editFormData.test_id}
                              onChange={handleEditFormChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Testni tanlang (ixtiyoriy)</option>
                              {tests.map((test) => (
                                <option key={test.id} value={test.id}>
                                  {test.title} ({test.total_questions} ta savol, {test.duration_minutes} daqiqa)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Test Scheduled At */}
                        {/* Test Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Test
                          </label>
                          {loadingTests ? (
                            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400">
                              Testlar yuklanmoqda...
                            </div>
                          ) : (
                            <select
                              name="test_id"
                              value={editFormData.test_id}
                              onChange={handleEditFormChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Testni tanlang (ixtiyoriy)</option>
                              {tests.map((test) => (
                                <option key={test.id} value={test.id}>
                                  {test.title} ({test.total_questions} ta savol, {test.duration_minutes} daqiqa)
                                </option>
                              ))}
                            </select>
                          )}
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

                      {/* Branch Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Filial turi <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="branch_type"
                          value={editFormData.branch_type}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Filial turini tanlang</option>
                          <option value="central">Markaziy Apparat</option>
                          <option value="regional">Hududiy Boshqarma</option>
                        </select>
                      </div>

                      {/* Region - only show if branch_type is regional */}
                      {editFormData.branch_type === "regional" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hudud <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="region"
                            value={editFormData.region}
                            onChange={handleEditFormChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Hududni tanlang</option>
                            <option value="toshkent">Toshkent</option>
                            <option value="qashqadaryo">Qashqadaryo</option>
                            <option value="samarqand">Samarqand</option>
                            <option value="navoiy">Navoiy</option>
                            <option value="andijon">Andijon</option>
                            <option value="fargona">Farg'ona</option>
                            <option value="namangan">Namangan</option>
                            <option value="surxondaryo">Surxondaryo</option>
                            <option value="sirdaryo">Sirdaryo</option>
                            <option value="jizzax">Jizzax</option>
                            <option value="buxoro">Buxoro</option>
                            <option value="xorazm">Xorazm</option>
                            <option value="qoraqalpogiston">Qoraqalpog'iston Respublikasi</option>
                          </select>
                        </div>
                      )}

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

                      {/* Quantity */}
                      <div>
                        <label
                          htmlFor="quantity"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Vakant soni
                        </label>
                        <input
                          type="number"
                          id="quantity"
                          name="quantity"
                          value={editFormData.quantity}
                          onChange={handleEditFormChange}
                          disabled={editSaving}
                          min="1"
                          step="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Vakant sonini kiriting (masalan: 5)"
                        />
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
                            {editingVacancy.management_details.name_uz || editingVacancy.management_details.name}
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
    </div>
  );
};

export default Vacancies;

