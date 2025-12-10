import { useState, useEffect } from "react";
import {
  getDepartmentsApi,
  getManagementApi,
  createDepartmentApi,
  createManagementApi,
  createVacancyApi,
} from "../../utils/api";
import toast from "react-hot-toast";

const QuickCreateVacancyModal = ({ isOpen, onClose, onSuccess, initialBranchType = null, initialRegion = null }) => {
  const [step, setStep] = useState(1); // 1: Department, 2: Management, 3: Vacancy
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [managements, setManagements] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingManagements, setLoadingManagements] = useState(false);

  // Form data
  const [departmentData, setDepartmentData] = useState({
    selectedId: "",
    createNew: false,
    name: "",
    description: "",
    department_tasks: [{ task: "" }],
  });

  const [managementData, setManagementData] = useState({
    selectedId: "",
    createNew: false,
    name: "",
    management_functions: "",
  });

  const [vacancyData, setVacancyData] = useState({
    title: "",
    description: "",
    requirements: "",
    job_tasks: "",
    is_active: true,
    application_deadline: "",
    test_scheduled_at: "",
    branch_type: "",
    region: "",
    requirements_eng: "",
    requirements_ru: "",
  });

  useEffect(() => {
    if (isOpen) {
      // If regional branch type, skip to step 3 (vacancy form)
      if (initialBranchType === "regional") {
        setStep(3);
        setVacancyData({
          title: "",
          description: "",
          requirements: "",
          job_tasks: "",
          is_active: true,
          application_deadline: "",
          test_scheduled_at: "",
          branch_type: initialBranchType || "",
          region: initialRegion || "",
          requirements_eng: "",
          requirements_ru: "",
        });
      } else {
        fetchDepartments();
        // Reset form when modal opens
        setStep(1);
        setDepartmentData({
          selectedId: "",
          createNew: false,
          name: "",
          description: "",
          department_tasks: [{ task: "" }],
        });
        setManagementData({
          selectedId: "",
          createNew: false,
          name: "",
          management_functions: "",
        });
        setVacancyData({
          title: "",
          description: "",
          requirements: "",
          job_tasks: "",
          is_active: true,
          application_deadline: "",
          test_scheduled_at: "",
          branch_type: initialBranchType || "",
          region: initialRegion || "",
          requirements_eng: "",
          requirements_ru: "",
        });
      }
    }
  }, [isOpen, initialBranchType, initialRegion]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await getDepartmentsApi();
      // Handle paginated response format: { results: [...], count: ... }
      const departmentsArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      setDepartments(departmentsArray);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Bo'limlarni yuklashda xatolik");
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

  const handleTaskChange = (index, value) => {
    const updated = [...departmentData.department_tasks];
    updated[index] = { task: value };
    setDepartmentData((prev) => ({ ...prev, department_tasks: updated }));
  };

  const addTask = () => {
    setDepartmentData((prev) => ({
      ...prev,
      department_tasks: [...prev.department_tasks, { task: "" }],
    }));
  };

  const removeTask = (index) => {
    if (departmentData.department_tasks.length <= 1) return;
    setDepartmentData((prev) => ({
      ...prev,
      department_tasks: prev.department_tasks.filter((_, i) => i !== index),
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validate and create/select department
      if (departmentData.createNew) {
        if (!departmentData.name.trim()) {
          toast.error("Bo'lim nomi kiritilishi shart");
          return;
        }
        if (!departmentData.description.trim()) {
          toast.error("Bo'lim tavsifi kiritilishi shart");
          return;
        }
        try {
          setLoading(true);
          const filteredTasks = departmentData.department_tasks.filter(
            (t) => (t.task || "").trim() !== ""
          );
          const newDept = await createDepartmentApi({
            name: departmentData.name.trim(),
            description: departmentData.description.trim(),
            department_tasks: filteredTasks,
          });
          setDepartmentData((prev) => ({
            ...prev,
            selectedId: newDept.id.toString(),
            createNew: false,
          }));
          await fetchDepartments();
          await fetchManagements(newDept.id);
          toast.success("Bo'lim muvaffaqiyatli yaratildi");
        } catch (error) {
          console.error("Error creating department:", error);
          toast.error("Bo'limni yaratishda xatolik");
          return;
        } finally {
          setLoading(false);
        }
      } else {
        if (!departmentData.selectedId) {
          toast.error("Bo'limni tanlang yoki yangi yarating");
          return;
        }
        await fetchManagements(departmentData.selectedId);
      }
      setStep(2);
    } else if (step === 2) {
      // Validate and create/select management
      if (managementData.createNew) {
        if (!managementData.name.trim()) {
          toast.error("Boshqarma nomi kiritilishi shart");
          return;
        }
        if (!managementData.management_functions.trim()) {
          toast.error("Boshqarma vazifalari kiritilishi shart");
          return;
        }
        try {
          setLoading(true);
          const newMgmt = await createManagementApi({
            name: managementData.name.trim(),
            management_functions: managementData.management_functions.trim(),
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vacancyData.title.trim()) {
      toast.error("Vakansiya nomi kiritilishi shart");
      return;
    }
    if (!vacancyData.description.trim()) {
      toast.error("Vakansiya tavsifi kiritilishi shart");
      return;
    }
    if (!vacancyData.requirements.trim()) {
      toast.error("Talablar kiritilishi shart");
      return;
    }
    if (!vacancyData.job_tasks.trim()) {
      toast.error("Ish vazifalari kiritilishi shart");
      return;
    }
    if (!vacancyData.application_deadline) {
      toast.error("Ariza berish muddati kiritilishi shart");
      return;
    }

    if (!vacancyData.branch_type) {
      toast.error("Filial turini tanlash shart");
      return;
    }

    if (vacancyData.branch_type === "regional" && !vacancyData.region) {
      toast.error("Hududni tanlash shart");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: vacancyData.title.trim(),
        description: vacancyData.description.trim(),
        requirements: vacancyData.requirements.trim(),
        job_tasks: vacancyData.job_tasks.trim(),
        is_active: vacancyData.is_active,
        application_deadline: vacancyData.application_deadline,
        branch_type: vacancyData.branch_type,
        region: vacancyData.branch_type === "central" ? null : vacancyData.region,
        // Only include management_id for central branch type
        ...(vacancyData.branch_type === "central" && {
          management_id: parseInt(managementData.selectedId),
        }),
        ...(vacancyData.test_scheduled_at && {
          test_scheduled_at: formatDateTimeWithTimezone(
            vacancyData.test_scheduled_at
          ),
        }),
        ...(vacancyData.requirements_eng && {
          requirements_eng: vacancyData.requirements_eng,
        }),
        ...(vacancyData.requirements_ru && {
          requirements_ru: vacancyData.requirements_ru,
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                  : step === 1 && "1/3 - Bo'limni tanlang yoki yarating"
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
                    Bo'limni tanlang yoki yangi yarating
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
                    <option value="">Bo'limni tanlang...</option>
                    {Array.isArray(departments) && departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                    <option value="new">+ Yangi bo'lim yaratish</option>
                  </select>
                </div>

                {departmentData.createNew && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bo'lim nomi *
                      </label>
                      <input
                        type="text"
                        value={departmentData.name}
                        onChange={(e) =>
                          setDepartmentData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Bo'lim nomini kiriting"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bo'lim tavsifi *
                      </label>
                      <textarea
                        value={departmentData.description}
                        onChange={(e) =>
                          setDepartmentData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        disabled={loading}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Bo'lim tavsifini kiriting"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bo'lim vazifalari
                      </label>
                      <div className="space-y-2">
                        {departmentData.department_tasks.map((task, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <textarea
                              value={task.task}
                              onChange={(e) =>
                                handleTaskChange(index, e.target.value)
                              }
                              disabled={loading}
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder={`Vazifa ${index + 1}`}
                            />
                            {departmentData.department_tasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTask(index)}
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
                          onClick={addTask}
                          disabled={loading}
                          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                        >
                          + Vazifa qo'shish
                        </button>
                      </div>
                    </div>
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
                        {mgmt.name}
                      </option>
                    ))}
                    <option value="new">+ Yangi boshqarma yaratish</option>
                  </select>
                </div>

                {managementData.createNew && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Boshqarma nomi *
                      </label>
                      <input
                        type="text"
                        value={managementData.name}
                        onChange={(e) =>
                          setManagementData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Boshqarma nomini kiriting"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Boshqarma vazifalari *
                      </label>
                      <textarea
                        value={managementData.management_functions}
                        onChange={(e) =>
                          setManagementData((prev) => ({
                            ...prev,
                            management_functions: e.target.value,
                          }))
                        }
                        disabled={loading}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Boshqarma vazifalarini kiriting"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Vacancy */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vakansiya nomi *
                  </label>
                  <input
                    type="text"
                    value={vacancyData.title}
                    onChange={(e) =>
                      setVacancyData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Vakansiya nomini kiriting"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vakansiya tavsifi *
                  </label>
                  <textarea
                    value={vacancyData.description}
                    onChange={(e) =>
                      setVacancyData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    disabled={loading}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Vakansiya tavsifini kiriting"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Talablar *
                    </label>
                    <textarea
                      value={vacancyData.requirements}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          requirements: e.target.value,
                        }))
                      }
                      disabled={loading}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Talablarni kiriting"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ish vazifalari *
                    </label>
                    <textarea
                      value={vacancyData.job_tasks}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          job_tasks: e.target.value,
                        }))
                      }
                      disabled={loading}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ish vazifalarini kiriting"
                      required
                    />
                  </div>
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
                      value={vacancyData.requirements_eng}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          requirements_eng: e.target.value,
                        }))
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Tanlang</option>
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
                      value={vacancyData.requirements_ru}
                      onChange={(e) =>
                        setVacancyData((prev) => ({
                          ...prev,
                          requirements_ru: e.target.value,
                        }))
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Tanlang</option>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>
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
              {step > 1 && (
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

