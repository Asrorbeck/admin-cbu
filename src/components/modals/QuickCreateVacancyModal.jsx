import { useState, useEffect } from "react";
import {
  getDepartmentsApi,
  getManagementApi,
  createDepartmentApi,
  createManagementApi,
  createVacancyApi,
  getTestsApi,
} from "../../utils/api";
import { latinToCyrillic } from "../../utils/transliterate";
import { getStaticRequirementsAsObjects, mergeStaticRequirements } from "../../utils/staticRequirements";
import toast from "react-hot-toast";

// Convert region value to backend format
const getBackendRegionValue = (regionValue) => {
  if (!regionValue) return null;
  if (regionValue === "toshkent_viloyati") {
    return "toshkent";
  }
  // Convert URL-friendly format to backend format
  if (regionValue === "toshkent-shahar" || regionValue === "toshkent_shahar") {
    return "toshkent shahar";
  }
  return regionValue;
};

const QuickCreateVacancyModal = ({ isOpen, onClose, onSuccess, initialBranchType = null, initialRegion = null }) => {
  const [step, setStep] = useState(1); // 1: Department, 2: Management, 3: Vacancy
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [managements, setManagements] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingManagements, setLoadingManagements] = useState(false);
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  
  // Get static requirements
  const staticRequirements = getStaticRequirementsAsObjects();

  // Form data
  const [departmentData, setDepartmentData] = useState({
    selectedId: "",
    createNew: false,
    name_uz: "",
    name_cr: "",
    name_ru: "",
    department_tasks_uz: [{ task: "" }],
    department_tasks_cr: [{ task: "" }],
    department_tasks_ru: [{ task: "" }],
  });

  // Track if user manually edited Cyrillic fields (to prevent auto-transliteration)
  const [manualEditFlags, setManualEditFlags] = useState({
    name_cr: false,
    tasks_cr: {},
  });

  const [managementData, setManagementData] = useState({
    selectedId: "",
    createNew: false,
    name_uz: "",
    name_cr: "",
    name_ru: "",
  });
  const [managementManualEditFlags, setManagementManualEditFlags] = useState({
    name_cr: false,
  });

  const [vacancyData, setVacancyData] = useState({
    title_uz: "",
    title_cr: "",
    title_ru: "",
    region_title_uz: "",
    region_title_cr: "",
    region_title_ru: "",
    requirements_uz: [...staticRequirements.uz, { task: "" }],
    requirements_cr: [...staticRequirements.cr, { task: "" }],
    requirements_ru: [...staticRequirements.ru, { task: "" }],
    job_tasks_uz: [{ task: "" }],
    job_tasks_cr: [{ task: "" }],
    job_tasks_ru: [{ task: "" }],
    is_active: true,
    application_deadline: "",
    test_scheduled_at: "",
    branch_type: "",
    region: "",
    lan_requirements_eng: "not_required",
    lan_requirements_ru: "not_required",
    test_id: "",
    quantity: "1",
  });
  const [vacancyManualEditFlags, setVacancyManualEditFlags] = useState({
    title_cr: false,
    region_title_cr: false,
    requirements_cr: {},
    job_tasks_cr: {},
  });
  const [vacancyExpandedSections, setVacancyExpandedSections] = useState({
    requirements: false,
    job_tasks: false,
  });

  useEffect(() => {
    if (isOpen) {
      // If regional branch type, skip to step 3 (vacancy form)
      if (initialBranchType === "regional") {
        setStep(3);
        fetchTests(); // Fetch tests for regional vacancies too
        setVacancyData({
          title_uz: "",
          title_cr: "",
          title_ru: "",
          region_title_uz: "",
          region_title_cr: "",
          region_title_ru: "",
          requirements_uz: [...staticRequirements.uz, { task: "" }],
          requirements_cr: [...staticRequirements.cr, { task: "" }],
          requirements_ru: [...staticRequirements.ru, { task: "" }],
          job_tasks_uz: [{ task: "" }],
          job_tasks_cr: [{ task: "" }],
          job_tasks_ru: [{ task: "" }],
          is_active: true,
          application_deadline: "",
          test_scheduled_at: "",
          branch_type: initialBranchType !== null && initialBranchType !== undefined ? initialBranchType : "central", // Always central if no initialBranchType
          region: initialRegion || "",
          lan_requirements_eng: "not_required",
          lan_requirements_ru: "not_required",
          test_id: "",
          quantity: "1",
        });
        setVacancyManualEditFlags({
          title_cr: false,
          region_title_cr: false,
          requirements_cr: {},
          job_tasks_cr: {},
        });
      } else {
        fetchDepartments();
        fetchTests();
        // Reset form when modal opens
        setStep(1);
        setDepartmentData({
          selectedId: "",
          createNew: false,
          name_uz: "",
          name_cr: "",
          name_ru: "",
          department_tasks_uz: [{ task: "" }],
          department_tasks_cr: [{ task: "" }],
          department_tasks_ru: [{ task: "" }],
        });
        setManualEditFlags({
          name_cr: false,
          tasks_cr: {},
        });
        setManagementData({
          selectedId: "",
          createNew: false,
          name_uz: "",
          name_cr: "",
          name_ru: "",
        });
        setManagementManualEditFlags({
          name_cr: false,
        });
        setVacancyData({
          title_uz: "",
          title_cr: "",
          title_ru: "",
          region_title_uz: "",
          region_title_cr: "",
          region_title_ru: "",
          requirements_uz: [...staticRequirements.uz, { task: "" }],
          requirements_cr: [...staticRequirements.cr, { task: "" }],
          requirements_ru: [...staticRequirements.ru, { task: "" }],
          job_tasks_uz: [{ task: "" }],
          job_tasks_cr: [{ task: "" }],
          job_tasks_ru: [{ task: "" }],
          is_active: true,
          application_deadline: "",
          test_scheduled_at: "",
          branch_type: initialBranchType !== null && initialBranchType !== undefined ? initialBranchType : "central", // Always central if no initialBranchType
          region: initialRegion || "",
          lan_requirements_eng: "not_required",
          lan_requirements_ru: "not_required",
          test_id: "",
          quantity: "1",
        });
        setVacancyManualEditFlags({
          title_cr: false,
          region_title_cr: false,
          requirements_cr: {},
          job_tasks_cr: {},
        });
      }
    }
  }, [isOpen, initialBranchType, initialRegion]);

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

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await getDepartmentsApi({ page_size: 50 });
      // Handle paginated response format: { results: [...], count: ... }
      const departmentsArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      setDepartments(departmentsArray);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Departamentlarni yuklashda xatolik");
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchManagements = async (departmentId) => {
    try {
      setLoadingManagements(true);
      const data = await getManagementApi(departmentId);
      // Handle paginated response format: { results: [...], count: ... }
      const managementsArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      setManagements(managementsArray);
    } catch (error) {
      console.error("Error fetching managements:", error);
      toast.error("Boshqarmalarni yuklashda xatolik");
      setManagements([]);
    } finally {
      setLoadingManagements(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setDepartmentData((prev) => ({ ...prev, createNew: true, selectedId: "" }));
    } else {
      setDepartmentData((prev) => ({
        ...prev,
        selectedId: value,
        createNew: false,
      }));
      if (value) {
        fetchManagements(value);
      }
    }
  };

  const handleManagementChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setManagementData((prev) => ({ ...prev, createNew: true, selectedId: "" }));
    } else {
      setManagementData((prev) => ({
        ...prev,
        selectedId: value,
        createNew: false,
      }));
    }
  };

  const handleTaskChange = (lang, index, value) => {
    const fieldName = `department_tasks_${lang}`;
    const updated = [...departmentData[fieldName]];
    updated[index] = { task: value };
    
    // Auto-transliterate to Cyrillic if changing Uzbek Latin task
    if (lang === 'uz') {
      const taskKey = `task_${index}`;
      const isManuallyEdited = manualEditFlags.tasks_cr[taskKey] || false;
      
      if (!isManuallyEdited) {
        // Auto-transliterate corresponding Cyrillic task
        const cyrillicFieldName = 'department_tasks_cr';
        const cyrillicTasks = [...departmentData[cyrillicFieldName]];
        if (cyrillicTasks[index]) {
          cyrillicTasks[index] = { task: latinToCyrillic(value) };
        }
        setDepartmentData((prev) => ({
          ...prev,
          [fieldName]: updated,
          [cyrillicFieldName]: cyrillicTasks,
        }));
        return;
      }
    }
    
    // If Cyrillic task is being edited, mark it as manually edited
    if (lang === 'cr') {
      const taskKey = `task_${index}`;
      setManualEditFlags((prev) => ({
        ...prev,
        tasks_cr: {
          ...prev.tasks_cr,
          [taskKey]: true,
        },
      }));
    }
    
    setDepartmentData((prev) => ({ ...prev, [fieldName]: updated }));
  };

  const addTask = (lang) => {
    const fieldName = `department_tasks_${lang}`;
    setDepartmentData((prev) => ({
      ...prev,
      [fieldName]: [...prev[fieldName], { task: "" }],
    }));
  };

  const removeTask = (lang, index) => {
    const fieldName = `department_tasks_${lang}`;
    if (departmentData[fieldName].length <= 1) return;
    setDepartmentData((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validate and create/select department
      if (departmentData.createNew) {
        // Validate at least one name is provided
        if (!departmentData.name_uz.trim() && !departmentData.name_cr.trim() && !departmentData.name_ru.trim()) {
          toast.error("Kamida bitta tilda departament nomi kiritilishi shart");
          return;
        }
        
        // Filter tasks for each language
        const filteredTasksUz = departmentData.department_tasks_uz.filter(
          (t) => (t.task || "").trim() !== ""
        );
        const filteredTasksCr = departmentData.department_tasks_cr.filter(
          (t) => (t.task || "").trim() !== ""
        );
        const filteredTasksRu = departmentData.department_tasks_ru.filter(
          (t) => (t.task || "").trim() !== ""
        );

        // Validate at least one task is provided
        if (filteredTasksUz.length === 0 && filteredTasksCr.length === 0 && filteredTasksRu.length === 0) {
          toast.error("Kamida bitta tilda vazifa kiritilishi shart");
          return;
        }

        try {
          setLoading(true);
          const payload = {
            name_uz: departmentData.name_uz.trim(),
            name_cr: departmentData.name_cr.trim(),
            name_ru: departmentData.name_ru.trim(),
            department_tasks_uz: filteredTasksUz,
            department_tasks_cr: filteredTasksCr,
            department_tasks_ru: filteredTasksRu,
          };
          const newDept = await createDepartmentApi(payload);
          setDepartmentData((prev) => ({
            ...prev,
            selectedId: newDept.id.toString(),
            createNew: false,
          }));
          await fetchDepartments();
          await fetchManagements(newDept.id);
          toast.success("Departament muvaffaqiyatli yaratildi");
        } catch (error) {
          console.error("Error creating department:", error);
          toast.error("Departamentni yaratishda xatolik");
          return;
        } finally {
          setLoading(false);
        }
      } else {
        if (!departmentData.selectedId) {
          toast.error("Departamentni tanlang yoki yangi yarating");
          return;
        }
        await fetchManagements(departmentData.selectedId);
      }
      setStep(2);
    } else if (step === 2) {
      // Validate and create/select management
      if (managementData.createNew) {
        if (!managementData.name_uz.trim()) {
          toast.error("Boshqarma nomi (O'zbekcha) kiritilishi shart");
          return;
        }
        try {
          setLoading(true);
          const newMgmt = await createManagementApi({
            name_uz: managementData.name_uz.trim(),
            name_cr: managementData.name_cr.trim(),
            name_ru: managementData.name_ru.trim(),
            department: parseInt(departmentData.selectedId),
          });
          setManagementData((prev) => ({
            ...prev,
            selectedId: newMgmt.id.toString(),
            createNew: false,
          }));
          await fetchManagements(departmentData.selectedId);
          toast.success("Boshqarma muvaffaqiyatli yaratildi");
        } catch (error) {
          console.error("Error creating management:", error);
          toast.error("Boshqarmani yaratishda xatolik");
          return;
        } finally {
          setLoading(false);
        }
      } else {
        if (!managementData.selectedId) {
          toast.error("Boshqarmani tanlang yoki yangi yarating");
          return;
        }
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const formatDateTimeWithTimezone = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    const [datePart, timePart] = datetimeLocal.split("T");
    return `${datePart}T${timePart}:00+05:00`;
  };

  const handleVacancyTaskChange = (type, lang, index, value) => {
    const fieldName = `${type}_${lang}`;
    const updated = [...vacancyData[fieldName]];
    updated[index] = { task: value };
    
    // Auto-transliterate Uzbek Latin tasks to Cyrillic
    if (lang === 'uz') {
      const taskKey = `${type}_${index}`;
      const isManuallyEdited = vacancyManualEditFlags[`${type}_cr`]?.[taskKey] || false;
      
      if (!isManuallyEdited) {
        const cyrillicFieldName = `${type}_cr`;
        const cyrillicTasks = [...vacancyData[cyrillicFieldName]];
        // Ensure the array is long enough
        while (cyrillicTasks.length <= index) {
          cyrillicTasks.push({ task: "" });
        }
        cyrillicTasks[index] = { task: latinToCyrillic(value) };
        setVacancyData({ 
          ...vacancyData, 
          [fieldName]: updated,
          [cyrillicFieldName]: cyrillicTasks,
        });
        return;
      }
    }
    
    // If Cyrillic task is being edited, mark as manually edited
    if (lang === 'cr') {
      const taskKey = `${type}_${index}`;
      setVacancyManualEditFlags((prev) => ({
        ...prev,
        [`${type}_cr`]: {
          ...(prev[`${type}_cr`] || {}),
          [taskKey]: true,
        },
      }));
    }
    
    setVacancyData({ ...vacancyData, [fieldName]: updated });
  };

  const addVacancyTask = (type, lang) => {
    const fieldName = `${type}_${lang}`;
    setVacancyData({
      ...vacancyData,
      [fieldName]: [...vacancyData[fieldName], { task: "" }],
    });
  };

  const removeVacancyTask = (type, lang, index) => {
    const fieldName = `${type}_${lang}`;
    if (vacancyData[fieldName].length <= 1) return;
    setVacancyData({
      ...vacancyData,
      [fieldName]: vacancyData[fieldName].filter((_, i) => i !== index),
    });
  };

  const toggleVacancySection = (section) => {
    setVacancyExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate title
    if (!vacancyData.title_uz.trim()) {
      toast.error("Vakansiya nomi (O'zbekcha) kiritilishi shart");
      return;
    }

    // Filter and validate requirements
    const filteredRequirementsUz = vacancyData.requirements_uz.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredRequirementsCr = vacancyData.requirements_cr.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredRequirementsRu = vacancyData.requirements_ru.filter(
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
    const filteredJobTasksUz = vacancyData.job_tasks_uz.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredJobTasksCr = vacancyData.job_tasks_cr.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredJobTasksRu = vacancyData.job_tasks_ru.filter(
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

    if (!vacancyData.application_deadline) {
      toast.error("Ariza berish muddati kiritilishi shart");
      return;
    }

    // If no initialBranchType, branch_type should always be "central"
    const finalBranchType = initialBranchType !== null && initialBranchType !== undefined ? vacancyData.branch_type : "central";
    
    if (!finalBranchType) {
      toast.error("Filial turini tanlash shart");
      return;
    }

    if (finalBranchType === "regional" && !vacancyData.region) {
      toast.error("Hududni tanlash shart");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title_uz: vacancyData.title_uz.trim(),
        title_cr: vacancyData.title_cr.trim(),
        title_ru: vacancyData.title_ru.trim(),
        requirements_uz: filteredRequirementsUz,
        requirements_cr: filteredRequirementsCr,
        requirements_ru: filteredRequirementsRu,
        job_tasks_uz: filteredJobTasksUz,
        job_tasks_cr: filteredJobTasksCr,
        job_tasks_ru: filteredJobTasksRu,
        lan_requirements_eng: vacancyData.lan_requirements_eng,
        lan_requirements_ru: vacancyData.lan_requirements_ru,
        is_active: vacancyData.is_active,
        application_deadline: vacancyData.application_deadline,
        test_scheduled_at: vacancyData.test_scheduled_at
          ? formatDateTimeWithTimezone(vacancyData.test_scheduled_at)
          : null,
        ...(vacancyData.test_id && {
          test_ids: [parseInt(vacancyData.test_id)],
        }),
        quantity: vacancyData.quantity && vacancyData.quantity !== "" && !isNaN(parseInt(vacancyData.quantity, 10))
          ? parseInt(vacancyData.quantity, 10)
          : 1,
        branch_type: initialBranchType !== null && initialBranchType !== undefined ? vacancyData.branch_type : "central", // Always central if no initialBranchType
        region: (initialBranchType !== null && initialBranchType !== undefined ? vacancyData.branch_type : "central") === "central" ? null : getBackendRegionValue(vacancyData.region),
        // Only include management_id for central branch type
        ...(vacancyData.branch_type === "central" && {
          management_id: parseInt(managementData.selectedId),
        }),
        // Only include region_title fields for regional branch type
        ...(vacancyData.branch_type === "regional" && {
          region_title_uz: vacancyData.region_title_uz.trim(),
          region_title_cr: vacancyData.region_title_cr.trim(),
          region_title_ru: vacancyData.region_title_ru.trim(),
        }),
      };

      await createVacancyApi(payload);
      toast.success("Vakansiya muvaffaqiyatli yaratildi");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating vacancy:", error);
      toast.error("Vakansiya yaratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tezkor vakansiya yaratish
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {initialBranchType === "regional" 
                  ? "Hududiy vakansiya yaratish"
                  : step === 1 && "1/3 - Departamentni tanlang yoki yarating"
                  || step === 2 && "2/3 - Boshqarmani tanlang yoki yarating"
                  || step === 3 && "3/3 - Vakansiya ma'lumotlarini kiriting"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Steps - Only show if not regional */}
          {initialBranchType !== "regional" && (
            <div className="mt-4 flex items-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step >= s
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {step > s ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          <div className="px-6 py-4 space-y-4">
            {/* Step 1: Department */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Departamentni tanlang yoki yangi yarating
                  </label>
                  <select
                    value={
                      departmentData.createNew
                        ? "new"
                        : departmentData.selectedId
                    }
                    onChange={handleDepartmentChange}
                    disabled={loading || loadingDepartments}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Departamentni tanlang...</option>
                    {Array.isArray(departments) && departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name_uz || dept.name || `Departament #${dept.id}`}
                      </option>
                    ))}
                    <option value="new">+ Yangi departament yaratish</option>
                  </select>
                </div>

                {departmentData.createNew && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    {/* Department Names - Multilingual */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Departament nomi (3 tilda) *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            O'zbekcha
                          </label>
                          <input
                            type="text"
                            value={departmentData.name_uz}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setDepartmentData((prev) => {
                                // Auto-transliterate to Cyrillic if not manually edited
                                const updated = {
                                  ...prev,
                                  name_uz: newValue,
                                };
                                if (!manualEditFlags.name_cr) {
                                  updated.name_cr = latinToCyrillic(newValue);
                                }
                                return updated;
                              });
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="O'zbekcha nom"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            O'zbekcha (Kirill)
                          </label>
                          <input
                            type="text"
                            value={departmentData.name_cr}
                            onChange={(e) => {
                              setDepartmentData((prev) => ({
                                ...prev,
                                name_cr: e.target.value,
                              }));
                              // Mark as manually edited to stop auto-transliteration
                              setManualEditFlags((prev) => ({
                                ...prev,
                                name_cr: true,
                              }));
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="O'zbekcha (Kirill) nom"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Ruscha
                          </label>
                          <input
                            type="text"
                            value={departmentData.name_ru}
                            onChange={(e) =>
                              setDepartmentData((prev) => ({
                                ...prev,
                                name_ru: e.target.value,
                              }))
                            }
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Русское название"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Department Tasks - Multilingual */}
                    {['uz', 'cr', 'ru'].map((lang) => {
                      const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                      const tasksField = `department_tasks_${lang}`;
                      const tasks = departmentData[tasksField] || [];
                      
                      return (
                        <div key={lang}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {langNames[lang]} vazifalari {lang === 'uz' && '*'}
                          </label>
                          <div className="space-y-2">
                            {tasks.map((task, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-2"
                              >
                                <textarea
                                  value={task.task}
                                  onChange={(e) =>
                                    handleTaskChange(lang, index, e.target.value)
                                  }
                                  disabled={loading}
                                  rows={2}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                  placeholder={`${langNames[lang]} vazifa ${index + 1}`}
                                />
                                {tasks.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTask(lang, index)}
                                    disabled={loading}
                                    className="mt-1 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                              onClick={() => addTask(lang)}
                              disabled={loading}
                              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                            >
                              + {langNames[lang]} vazifa qo'shish
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Management */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Boshqarmani tanlang yoki yangi yarating
                  </label>
                  <select
                    value={
                      managementData.createNew
                        ? "new"
                        : managementData.selectedId
                    }
                    onChange={handleManagementChange}
                    disabled={loading || loadingManagements}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Boshqarmani tanlang...</option>
                    {Array.isArray(managements) && managements.map((mgmt) => (
                      <option key={mgmt.id} value={mgmt.id}>
                        {mgmt.name_uz || mgmt.name || `Boshqarma #${mgmt.id}`}
                      </option>
                    ))}
                    <option value="new">+ Yangi boshqarma yaratish</option>
                  </select>
                </div>

                {managementData.createNew && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Boshqarma nomi (3 tilda) *
                      </label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            O'zbekcha *
                          </label>
                          <input
                            type="text"
                            value={managementData.name_uz}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setManagementData((prev) => {
                                // Auto-transliterate to Cyrillic if not manually edited
                                const updated = {
                                  ...prev,
                                  name_uz: newValue,
                                };
                                if (!managementManualEditFlags.name_cr) {
                                  updated.name_cr = latinToCyrillic(newValue);
                                }
                                return updated;
                              });
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="O'zbekcha nom"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            O'zbekcha (Kirill)
                          </label>
                          <input
                            type="text"
                            value={managementData.name_cr}
                            onChange={(e) => {
                              setManagementData((prev) => ({
                                ...prev,
                                name_cr: e.target.value,
                              }));
                              // Mark as manually edited to stop auto-transliteration
                              setManagementManualEditFlags((prev) => ({
                                ...prev,
                                name_cr: true,
                              }));
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="O'zbekcha (Kirill) nom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ruscha
                          </label>
                          <input
                            type="text"
                            value={managementData.name_ru}
                            onChange={(e) =>
                              setManagementData((prev) => ({
                                ...prev,
                                name_ru: e.target.value,
                              }))
                            }
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Русское название"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Vacancy */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Title - Multilingual */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Vakansiya nomi (3 tilda) *
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="vacancy_title_uz"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        O'zbekcha *
                      </label>
                      <input
                        type="text"
                        id="vacancy_title_uz"
                        value={vacancyData.title_uz}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setVacancyData((prev) => {
                            // Auto-transliterate to Cyrillic if not manually edited
                            const updated = {
                              ...prev,
                              title_uz: newValue,
                            };
                            if (!vacancyManualEditFlags.title_cr) {
                              updated.title_cr = latinToCyrillic(newValue);
                            }
                            return updated;
                          });
                        }}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        placeholder="O'zbekcha nom"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vacancy_title_cr"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        O'zbekcha (Kirill)
                      </label>
                      <input
                        type="text"
                        id="vacancy_title_cr"
                        value={vacancyData.title_cr}
                        onChange={(e) => {
                          setVacancyData((prev) => ({
                            ...prev,
                            title_cr: e.target.value,
                          }));
                          // Mark as manually edited to stop auto-transliteration
                          setVacancyManualEditFlags((prev) => ({
                            ...prev,
                            title_cr: true,
                          }));
                        }}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        placeholder="O'zbekcha (Kirill) nom"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vacancy_title_ru"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Ruscha
                      </label>
                      <input
                        type="text"
                        id="vacancy_title_ru"
                        value={vacancyData.title_ru}
                        onChange={(e) =>
                          setVacancyData((prev) => ({
                            ...prev,
                            title_ru: e.target.value,
                          }))
                        }
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        placeholder="Русское название"
                      />
                    </div>
                  </div>
                </div>

                {/* Region Title - Multilingual (only for regional branch type) */}
                {initialBranchType === "regional" && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Vakansiyaning to'liq nomi (3 tilda)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="vacancy_region_title_uz"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          O'zbekcha
                        </label>
                        <input
                          type="text"
                          id="vacancy_region_title_uz"
                          value={vacancyData.region_title_uz}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setVacancyData((prev) => {
                              // Auto-transliterate to Cyrillic if not manually edited
                              const updated = {
                                ...prev,
                                region_title_uz: newValue,
                              };
                              if (!vacancyManualEditFlags.region_title_cr) {
                                updated.region_title_cr = latinToCyrillic(newValue);
                              }
                              return updated;
                            });
                          }}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          placeholder="O'zbekcha to'liq nom"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="vacancy_region_title_cr"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          O'zbekcha (Kirill)
                        </label>
                        <input
                          type="text"
                          id="vacancy_region_title_cr"
                          value={vacancyData.region_title_cr}
                          onChange={(e) => {
                            setVacancyData((prev) => ({
                              ...prev,
                              region_title_cr: e.target.value,
                            }));
                            // Mark as manually edited to stop auto-transliteration
                            setVacancyManualEditFlags((prev) => ({
                              ...prev,
                              region_title_cr: true,
                            }));
                          }}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          placeholder="O'zbekcha (Kirill) to'liq nom"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="vacancy_region_title_ru"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Ruscha
                        </label>
                        <input
                          type="text"
                          id="vacancy_region_title_ru"
                          value={vacancyData.region_title_ru}
                          onChange={(e) =>
                            setVacancyData((prev) => ({
                              ...prev,
                              region_title_ru: e.target.value,
                            }))
                          }
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          placeholder="Полное название вакансии"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements - Multilingual with Accordion */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleVacancySection('requirements')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <label className="text-base font-semibold text-gray-900 dark:text-white">
                        Talablar *
                      </label>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500">
                        {vacancyData.requirements_uz.length + vacancyData.requirements_cr.length + vacancyData.requirements_ru.length} ta
                      </span>
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${vacancyExpandedSections.requirements ? 'rotate-180' : ''}`}
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
                  {vacancyExpandedSections.requirements && (
                    <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {['uz', 'cr', 'ru'].map((lang) => {
                        const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                        const requirementsField = `requirements_${lang}`;
                        const requirements = vacancyData[requirementsField] || [];
                        
                        return (
                          <div key={`vacancy_requirements_${lang}`} className="space-y-3">
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
                                        handleVacancyTaskChange('requirements', lang, index, e.target.value)
                                      }
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm transition-all"
                                      placeholder={`${langNames[lang]} talab ${index + 1}...`}
                                      disabled={loading}
                                    />
                                  </div>
                                  {requirements.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeVacancyTask('requirements', lang, index)}
                                      disabled={loading}
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
                                onClick={() => addVacancyTask('requirements', lang)}
                                disabled={loading}
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
                    onClick={() => toggleVacancySection('job_tasks')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <label className="text-base font-semibold text-gray-900 dark:text-white">
                        Ish vazifalari *
                      </label>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500">
                        {vacancyData.job_tasks_uz.length + vacancyData.job_tasks_cr.length + vacancyData.job_tasks_ru.length} ta
                      </span>
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${vacancyExpandedSections.job_tasks ? 'rotate-180' : ''}`}
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
                  {vacancyExpandedSections.job_tasks && (
                    <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {['uz', 'cr', 'ru'].map((lang) => {
                        const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                        const jobTasksField = `job_tasks_${lang}`;
                        const jobTasks = vacancyData[jobTasksField] || [];
                        
                        return (
                          <div key={`vacancy_job_tasks_${lang}`} className="space-y-3">
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
                                        handleVacancyTaskChange('job_tasks', lang, index, e.target.value)
                                      }
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-all"
                                      placeholder={`${langNames[lang]} vazifa ${index + 1}...`}
                                      disabled={loading}
                                    />
                                  </div>
                                  {jobTasks.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeVacancyTask('job_tasks', lang, index)}
                                      disabled={loading}
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
                                onClick={() => addVacancyTask('job_tasks', lang)}
                                disabled={loading}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ariza berish muddati *
                    </label>
                    <input
                      type="date"
                      value={vacancyData.application_deadline}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          application_deadline: e.target.value,
                        }))
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test
                    </label>
                    {loadingTests ? (
                      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400">
                        Testlar yuklanmoqda...
                      </div>
                    ) : (
                      <select
                        value={vacancyData.test_id}
                        onChange={(e) =>
                          setVacancyData((prev) => ({
                            ...prev,
                            test_id: e.target.value,
                          }))
                        }
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test bo'lish sanasi va vaqti
                    </label>
                    <input
                      type="datetime-local"
                      value={vacancyData.test_scheduled_at}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          test_scheduled_at: e.target.value,
                        }))
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Branch Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filial turi *
                  </label>
                  {initialBranchType === null || initialBranchType === undefined ? (
                    <>
                      <input
                        type="text"
                        value="Markaziy Apparat"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      />
                      <input
                        type="hidden"
                        name="branch_type"
                        value="central"
                      />
                    </>
                  ) : (
                    <>
                      <select
                        value={vacancyData.branch_type}
                        onChange={(e) =>
                          setVacancyData((prev) => ({
                            ...prev,
                            branch_type: e.target.value,
                            // Reset region if branch_type changes to central
                            region: e.target.value === "central" ? "" : prev.region,
                          }))
                        }
                        disabled={loading || !!initialBranchType}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">Filial turini tanlang</option>
                        <option value="central">Markaziy Apparat</option>
                        <option value="regional">Hududiy Boshqarma</option>
                      </select>
                      {initialBranchType && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Filial turi avtomatik tanlangan
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Region - only show if branch_type is regional */}
                {vacancyData.branch_type === "regional" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hudud *
                    </label>
                    <select
                      value={vacancyData.region}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          region: e.target.value,
                        }))
                      }
                      disabled={loading || !!initialRegion}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      required
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
                    {initialRegion && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Hudud avtomatik tanlangan
                      </p>
                    )}
                  </div>
                )}

                {/* Language Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Talab qilinadigan ingliz tili
                    </label>
                    <select
                      value={vacancyData.lan_requirements_eng}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          lan_requirements_eng: e.target.value,
                        }))
                      }
                      disabled={loading}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Talab qilinadigan rus tili
                    </label>
                    <select
                      value={vacancyData.lan_requirements_ru}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          lan_requirements_ru: e.target.value,
                        }))
                      }
                      disabled={loading}
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
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Vakant soni
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={vacancyData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVacancyData((prev) => ({
                        ...prev,
                        quantity: value === "" ? "1" : isNaN(parseInt(value, 10)) ? "1" : value,
                      }));
                    }}
                    disabled={loading}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Vakant sonini kiriting (masalan: 5)"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={vacancyData.is_active}
                    onChange={(e) =>
                      setVacancyData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    disabled={loading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Vakansiya faol
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <div>
              {step > 1 && initialBranchType !== "regional" && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Orqaga
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
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
                    "Keyingi"
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
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
                      Yaratilmoqda...
                    </>
                  ) : (
                    "Vakansiya yaratish"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCreateVacancyModal;

