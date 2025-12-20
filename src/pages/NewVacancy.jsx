import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createVacancyApi } from "../utils/api";
import { latinToCyrillic } from "../utils/transliterate";
import toast from "react-hot-toast";

const NewVacancy = () => {
  const { id } = useParams(); // management ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title_uz: "",
    title_cr: "",
    title_ru: "",
    requirements_uz: [{ task: "" }],
    requirements_cr: [{ task: "" }],
    requirements_ru: [{ task: "" }],
    job_tasks_uz: [{ task: "" }],
    job_tasks_cr: [{ task: "" }],
    job_tasks_ru: [{ task: "" }],
    is_active: true,
    application_deadline: "",
    test_scheduled_at: "",
    management_id: parseInt(id),
    branch_type: "",
    region: "",
    lan_requirements_eng: "not_required",
    lan_requirements_ru: "not_required",
  });
  const [manualEditFlags, setManualEditFlags] = useState({
    title_cr: false,
    requirements_cr: {},
    job_tasks_cr: {},
  });
  const [expandedSections, setExpandedSections] = useState({
    requirements: false,
    job_tasks: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    document.title = "Yangi vakansiya - Markaziy Bank Administratsiyasi";
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-transliterate title_uz to title_cr
    if (name === 'title_uz' && !manualEditFlags.title_cr) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        title_cr: latinToCyrillic(value),
      }));
    } else {
      // If editing title_cr, mark as manually edited
      if (name === 'title_cr') {
        setManualEditFlags((prev) => ({
          ...prev,
          title_cr: true,
        }));
      }
      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };
        // If branch_type changes to "central", reset region to empty
        if (name === "branch_type" && value === "central") {
          newData.region = "";
        }
        return newData;
      });
    }
  };

  const handleTaskChange = (type, lang, index, value) => {
    const fieldName = `${type}_${lang}`;
    const updated = [...formData[fieldName]];
    updated[index] = { task: value };
    
    // Auto-transliterate Uzbek Latin tasks to Cyrillic
    if (lang === 'uz') {
      const taskKey = `${type}_${index}`;
      const isManuallyEdited = manualEditFlags[`${type}_cr`]?.[taskKey] || false;
      
      if (!isManuallyEdited) {
        const cyrillicFieldName = `${type}_cr`;
        const cyrillicTasks = [...formData[cyrillicFieldName]];
        // Ensure the array is long enough
        while (cyrillicTasks.length <= index) {
          cyrillicTasks.push({ task: "" });
        }
        cyrillicTasks[index] = { task: latinToCyrillic(value) };
        setFormData({ 
          ...formData, 
          [fieldName]: updated,
          [cyrillicFieldName]: cyrillicTasks,
        });
        return;
      }
    }
    
    // If Cyrillic task is being edited, mark as manually edited
    if (lang === 'cr') {
      const taskKey = `${type}_${index}`;
      setManualEditFlags((prev) => ({
        ...prev,
        [`${type}_cr`]: {
          ...(prev[`${type}_cr`] || {}),
          [taskKey]: true,
        },
      }));
    }
    
    setFormData({ ...formData, [fieldName]: updated });
  };

  const addTask = (type, lang) => {
    const fieldName = `${type}_${lang}`;
    setFormData({
      ...formData,
      [fieldName]: [...formData[fieldName], { task: "" }],
    });
  };

  const removeTask = (type, lang, index) => {
    const fieldName = `${type}_${lang}`;
    if (formData[fieldName].length <= 1) return;
    setFormData({
      ...formData,
      [fieldName]: formData[fieldName].filter((_, i) => i !== index),
    });
  };

  // Helper function to format datetime-local value with GMT+5 timezone
  const formatDateTimeWithTimezone = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // Convert to ISO format with GMT+5 offset: "YYYY-MM-DDTHH:mm:ss+05:00"
    const [datePart, timePart] = datetimeLocal.split("T");
    return `${datePart}T${timePart}:00+05:00`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate title
    if (!formData.title_uz.trim()) {
      toast.error("Vakansiya nomi (O'zbekcha) kiritilishi shart");
      return;
    }

    // Filter and validate requirements
    const filteredRequirementsUz = formData.requirements_uz.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredRequirementsCr = formData.requirements_cr.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredRequirementsRu = formData.requirements_ru.filter(
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
    const filteredJobTasksUz = formData.job_tasks_uz.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredJobTasksCr = formData.job_tasks_cr.filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredJobTasksRu = formData.job_tasks_ru.filter(
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

    if (!formData.application_deadline) {
      toast.error("Ariza berish muddati kiritilishi shart");
      return;
    }

    if (!formData.branch_type) {
      toast.error("Filial turini tanlash shart");
      return;
    }

    if (formData.branch_type === "regional" && !formData.region) {
      toast.error("Hududni tanlash shart");
      return;
    }

    try {
      setLoading(true);

      const vacancyData = {
        title_uz: formData.title_uz.trim(),
        title_cr: formData.title_cr.trim(),
        title_ru: formData.title_ru.trim(),
        requirements_uz: filteredRequirementsUz,
        requirements_cr: filteredRequirementsCr,
        requirements_ru: filteredRequirementsRu,
        job_tasks_uz: filteredJobTasksUz,
        job_tasks_cr: filteredJobTasksCr,
        job_tasks_ru: filteredJobTasksRu,
        is_active: formData.is_active,
        application_deadline: formData.application_deadline,
        management_id: formData.management_id,
        branch_type: formData.branch_type,
        region: formData.branch_type === "central" ? null : formData.region,
        lan_requirements_eng: formData.lan_requirements_eng || "not_required",
        lan_requirements_ru: formData.lan_requirements_ru || "not_required",
        ...(formData.test_scheduled_at && {
          test_scheduled_at: formatDateTimeWithTimezone(
            formData.test_scheduled_at
          ),
        }),
      };

      console.log("Sending vacancy data:", vacancyData);

      await createVacancyApi(vacancyData);

      toast.success("Vakansiya muvaffaqiyatli yaratildi");
      navigate(`/management/${id}`);
    } catch (error) {
      console.error("Error creating vacancy:", error);
      toast.error("Vakansiya yaratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
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
              Yangi vakansiya yaratish
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Boshqarma uchun yangi vakansiya qo'shing
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title - Multilingual */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Vakansiya nomi (3 tilda) *
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title_uz"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  O'zbekcha *
                </label>
                <input
                  type="text"
                  id="title_uz"
                  name="title_uz"
                  value={formData.title_uz}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="O'zbekcha nom"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="title_cr"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  O'zbekcha (Kirill)
                </label>
                <input
                  type="text"
                  id="title_cr"
                  name="title_cr"
                  value={formData.title_cr}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="O'zbekcha (Kirill) nom"
                />
              </div>
              <div>
                <label
                  htmlFor="title_ru"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Ruscha
                </label>
                <input
                  type="text"
                  id="title_ru"
                  name="title_ru"
                  value={formData.title_ru}
                  onChange={handleChange}
                  disabled={loading}
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
              onClick={() => toggleSection('requirements')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <label className="text-base font-semibold text-gray-900 dark:text-white">
                  Talablar *
                </label>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500">
                  {formData.requirements_uz.length + formData.requirements_cr.length + formData.requirements_ru.length} ta
                </span>
              </div>
              <svg
                className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.requirements ? 'rotate-180' : ''}`}
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
            {expandedSections.requirements && (
              <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {['uz', 'cr', 'ru'].map((lang) => {
                  const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                  const requirementsField = `requirements_${lang}`;
                  const requirements = formData[requirementsField] || [];
                  
                  return (
                    <div key={`requirements_${lang}`} className="space-y-3">
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
                                  handleTaskChange('requirements', lang, index, e.target.value)
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm transition-all"
                                placeholder={`${langNames[lang]} talab ${index + 1}...`}
                              />
                            </div>
                            {requirements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTask('requirements', lang, index)}
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
                          onClick={() => addTask('requirements', lang)}
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
              onClick={() => toggleSection('job_tasks')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <label className="text-base font-semibold text-gray-900 dark:text-white">
                  Ish vazifalari *
                </label>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500">
                  {formData.job_tasks_uz.length + formData.job_tasks_cr.length + formData.job_tasks_ru.length} ta
                </span>
              </div>
              <svg
                className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.job_tasks ? 'rotate-180' : ''}`}
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
            {expandedSections.job_tasks && (
              <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {['uz', 'cr', 'ru'].map((lang) => {
                  const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
                  const jobTasksField = `job_tasks_${lang}`;
                  const jobTasks = formData[jobTasksField] || [];
                  
                  return (
                    <div key={`job_tasks_${lang}`} className="space-y-3">
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
                                  handleTaskChange('job_tasks', lang, index, e.target.value)
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-all"
                                placeholder={`${langNames[lang]} vazifa ${index + 1}...`}
                              />
                            </div>
                            {jobTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTask('job_tasks', lang, index)}
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
                          onClick={() => addTask('job_tasks', lang)}
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

          {/* Application Deadline */}
          <div>
            <label
              htmlFor="application_deadline"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Ariza berish muddati *
            </label>
            <input
              type="date"
              id="application_deadline"
              name="application_deadline"
              value={formData.application_deadline}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              required
            />
          </div>

          {/* Test Scheduled At */}
          <div>
            <label
              htmlFor="test_scheduled_at"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Test bo'lish sanasi va vaqti
            </label>
            <input
              type="datetime-local"
              id="test_scheduled_at"
              name="test_scheduled_at"
              value={formData.test_scheduled_at}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          {/* Branch Type */}
          <div>
            <label
              htmlFor="branch_type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Filial turi *
            </label>
            <select
              id="branch_type"
              name="branch_type"
              value={formData.branch_type}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              required
            >
              <option value="">Filial turini tanlang</option>
              <option value="central">Markaziy Apparat</option>
              <option value="regional">Hududiy Boshqarma</option>
            </select>
          </div>

          {/* Region - only show if branch_type is regional */}
          {formData.branch_type === "regional" && (
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Hudud *
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
            </div>
          )}

          {/* Language Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="lan_requirements_eng"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Talab qilinadigan ingliz tili
              </label>
              <select
                id="lan_requirements_eng"
                name="lan_requirements_eng"
                value={formData.lan_requirements_eng}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
              <label
                htmlFor="lan_requirements_ru"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Talab qilinadigan rus tili
              </label>
              <select
                id="lan_requirements_ru"
                name="lan_requirements_ru"
                value={formData.lan_requirements_ru}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Vakansiya faol
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading && (
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
              )}
              {loading ? "Yaratilmoqda..." : "Vakansiya yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVacancy;
