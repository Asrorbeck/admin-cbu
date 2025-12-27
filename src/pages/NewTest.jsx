import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTestApi, getVacancySelectionHierarchyApi } from "../utils/api";
import toast from "react-hot-toast";

const NewTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [isVacancyDropdownOpen, setIsVacancyDropdownOpen] = useState(false);
  
  // Navigation state for hierarchy
  const [navigationPath, setNavigationPath] = useState([]); // ['central'|'regional', deptIndex?, managementIndex?]
  const [selectedVacancyInfo, setSelectedVacancyInfo] = useState({}); // Map of vacancyId -> {title, path}
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    pass_score: "",
    max_violations: "",
    vacancy_ids: [],
    is_active: true,
    questions: [
      {
        text: "",
        choices: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
        order: 1,
        is_multiple_choice: false,
        image: null, // For frontend only, not sent to backend
      },
    ],
  });

  useEffect(() => {
    document.title = "Yangi test yaratish - Markaziy Bank Administratsiyasi";
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoadingHierarchy(true);
      const data = await getVacancySelectionHierarchyApi();
      setHierarchyData(data);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      toast.error("Vakansiya ma'lumotlarini yuklashda xatolik yuz berdi");
      setHierarchyData(null);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Get all vacancy IDs from a department, management, or region
  const getAllVacancyIds = (item) => {
    const ids = [];
    if (item.vacancies) {
      ids.push(...item.vacancies.map((v) => v.id));
    }
    if (item.managements) {
      item.managements.forEach((mgmt) => {
        if (mgmt.vacancies) {
          ids.push(...mgmt.vacancies.map((v) => v.id));
        }
      });
    }
    return ids;
  };

  // Toggle all vacancies from a department, management, or region
  const toggleAllVacancies = (item, path, label) => {
    const allIds = getAllVacancyIds(item);
    const currentIds = formData.vacancy_ids || [];
    const allSelected = allIds.every((id) => currentIds.includes(id));

    if (allSelected) {
      // Remove all
      setFormData((prev) => ({
        ...prev,
        vacancy_ids: prev.vacancy_ids.filter((id) => !allIds.includes(id)),
      }));
      // Remove from info map
      setSelectedVacancyInfo((prev) => {
        const updated = { ...prev };
        allIds.forEach((id) => delete updated[id]);
        return updated;
      });
    } else {
      // Add all
      const newIds = [...new Set([...currentIds, ...allIds])];
      setFormData((prev) => ({
        ...prev,
        vacancy_ids: newIds,
      }));
      // Add to info map
      const newInfo = { ...selectedVacancyInfo };
      allIds.forEach((id) => {
        const vacancy = findVacancyById(id);
        if (vacancy) {
          newInfo[id] = {
            title: vacancy.title_uz || vacancy.title || `Vakansiya #${id}`,
            path: path,
          };
        }
      });
      setSelectedVacancyInfo(newInfo);
    }
  };

  // Find vacancy by ID in hierarchy
  const findVacancyById = (vacancyId) => {
    if (!hierarchyData) return null;

    // Search in central
    if (hierarchyData.central) {
      for (const dept of hierarchyData.central) {
        // Check department level vacancies
        if (dept.vacancies) {
          const vacancy = dept.vacancies.find((v) => v.id === vacancyId);
          if (vacancy) return vacancy;
        }
        // Check management level vacancies
        if (dept.managements) {
          for (const mgmt of dept.managements) {
            if (mgmt.vacancies) {
              const vacancy = mgmt.vacancies.find((v) => v.id === vacancyId);
              if (vacancy) return vacancy;
            }
          }
        }
      }
    }

    // Search in regional
    if (hierarchyData.regional) {
      for (const region of hierarchyData.regional) {
        if (region.vacancies) {
          const vacancy = region.vacancies.find((v) => v.id === vacancyId);
          if (vacancy) return vacancy;
        }
      }
    }

    return null;
  };

  const handleVacancyToggle = (vacancyId, vacancyTitle, path) => {
    setFormData((prev) => {
      const vacancyIds = prev.vacancy_ids || [];
      const isSelected = vacancyIds.includes(vacancyId);

      if (isSelected) {
        return {
          ...prev,
          vacancy_ids: vacancyIds.filter((id) => id !== vacancyId),
        };
      } else {
        return {
          ...prev,
          vacancy_ids: [...vacancyIds, vacancyId],
        };
      }
    });

    // Update vacancy info
    setSelectedVacancyInfo((prev) => {
      const updated = { ...prev };
      if (updated[vacancyId]) {
        delete updated[vacancyId];
      } else {
        updated[vacancyId] = {
          title: vacancyTitle || `Vakansiya #${vacancyId}`,
          path: path,
        };
      }
      return updated;
    });
  };

  const removeVacancy = (vacancyId) => {
    setFormData((prev) => ({
      ...prev,
      vacancy_ids: (prev.vacancy_ids || []).filter((id) => id !== vacancyId),
    }));
    setSelectedVacancyInfo((prev) => {
      const updated = { ...prev };
      delete updated[vacancyId];
      return updated;
    });
  };

  // Navigation functions
  const navigateTo = (newPath) => {
    setNavigationPath(newPath);
  };

  const navigateBack = () => {
    setNavigationPath((prev) => prev.slice(0, -1));
  };

  const navigateToRoot = () => {
    setNavigationPath([]);
  };

  // Get current view based on navigation path
  const getCurrentView = () => {
    if (!hierarchyData) return null;

    if (navigationPath.length === 0) {
      return { type: "root" };
    }

    const [type, ...rest] = navigationPath;

    if (type === "central") {
      if (rest.length === 0) {
        return { type: "central" };
      }
      const deptIndex = typeof rest[0] === "string" ? parseInt(rest[0]) : rest[0];
      const department = hierarchyData.central?.[deptIndex];
      if (!department) return null;

      if (rest.length === 1) {
        return { type: "department", department, deptIndex };
      }

      const mgmtIndex = typeof rest[1] === "string" ? parseInt(rest[1]) : rest[1];
      const management = department.managements?.[mgmtIndex];
      if (!management) return null;

      return { type: "management", department, management, deptIndex, mgmtIndex };
    }

    if (type === "regional") {
      if (rest.length === 0) {
        return { type: "regional" };
      }
      const regionIndex = typeof rest[0] === "string" ? parseInt(rest[0]) : rest[0];
      const region = hierarchyData.regional?.[regionIndex];
      if (!region) return null;

      return { type: "region", region, regionIndex };
    }

    return null;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("vacancy-dropdown");
      if (dropdown && !dropdown.contains(event.target)) {
        setIsVacancyDropdownOpen(false);
        setNavigationPath([]); // Reset navigation when closing
      }
    };

    if (isVacancyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVacancyDropdownOpen]);

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value,
      order: questionIndex + 1,
    };
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const handleChoiceChange = (questionIndex, choiceIndex, field, value) => {
    const updatedQuestions = [...formData.questions];
    const updatedChoices = [...updatedQuestions[questionIndex].choices];
    updatedChoices[choiceIndex] = {
      ...updatedChoices[choiceIndex],
      [field]: value,
    };
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      choices: updatedChoices,
    };
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          text: "",
          choices: [
            { text: "", is_correct: false },
            { text: "", is_correct: false },
          ],
          order: formData.questions.length + 1,
          is_multiple_choice: false,
          image: null,
        },
      ],
    });
  };

  const handleImageChange = (questionIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Faqat rasm fayllari qabul qilinadi");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          image: reader.result, // Store as base64 for preview
        };
        setFormData({
          ...formData,
          questions: updatedQuestions,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      image: null,
    };
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const removeQuestion = (questionIndex) => {
    if (formData.questions.length > 1) {
      const updatedQuestions = formData.questions
        .filter((_, i) => i !== questionIndex)
        .map((q, i) => ({ ...q, order: i + 1 }));
      setFormData({
        ...formData,
        questions: updatedQuestions,
      });
    }
  };

  const addChoice = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].choices.push({
      text: "",
      is_correct: false,
    });
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const removeChoice = (questionIndex, choiceIndex) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[questionIndex].choices.length > 2) {
      updatedQuestions[questionIndex].choices = updatedQuestions[
        questionIndex
      ].choices.filter((_, i) => i !== choiceIndex);
      setFormData({
        ...formData,
        questions: updatedQuestions,
      });
    } else {
      toast.error("Har bir savol uchun kamida 2 ta variant bo'lishi kerak");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Test nomi kiritilishi shart");
      return;
    }

    if (!formData.duration || formData.duration <= 0) {
      toast.error("Vaqt (daqiqa) kiritilishi shart");
      return;
    }

    // Convert minutes to seconds
    const durationInSeconds = parseInt(formData.duration) * 60;

    if (
      !formData.pass_score ||
      formData.pass_score < 0 ||
      formData.pass_score > 100
    ) {
      toast.error("O'tish foizi 0 dan 100 gacha bo'lishi kerak");
      return;
    }

    if (!formData.max_violations || formData.max_violations < 0) {
      toast.error("Maksimal buzilishlar soni kiritilishi shart");
      return;
    }

    if (!formData.vacancy_ids || formData.vacancy_ids.length === 0) {
      toast.error("Kamida bitta vakansiya tanlanishi shart");
      return;
    }

    // Validate questions
    const validQuestions = formData.questions.filter(
      (q) => q.text.trim() !== ""
    );

    if (validQuestions.length === 0) {
      toast.error("Kamida bitta savol qo'shish kerak");
      return;
    }

    // Validate each question
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];
      const validChoices = question.choices.filter((c) => c.text.trim() !== "");

      if (validChoices.length < 2) {
        toast.error(`${i + 1}-savol uchun kamida 2 ta variant bo'lishi kerak`);
        return;
      }

      const hasCorrectAnswer = validChoices.some((c) => c.is_correct);
      if (!hasCorrectAnswer) {
        toast.error(
          `${i + 1}-savol uchun kamida 1 ta to'g'ri javob belgilanishi kerak`
        );
        return;
      }

      // For single choice questions, ensure only one correct answer
      if (!question.is_multiple_choice) {
        const correctAnswersCount = validChoices.filter(
          (c) => c.is_correct
        ).length;
        if (correctAnswersCount > 1) {
          toast.error(
            `${
              i + 1
            }-savol bittalik variantlik savol, faqat 1 ta to'g'ri javob bo'lishi kerak`
          );
          return;
        }
      }
    }

    try {
      setLoading(true);

      const testData = {
        title: formData.title.trim(),
        duration: durationInSeconds.toString(),
        pass_score: parseInt(formData.pass_score),
        max_violations: parseInt(formData.max_violations),
        vacancy_ids: formData.vacancy_ids.map((id) => parseInt(id)),
        is_active: formData.is_active,
        questions: validQuestions.map((q) => ({
          text: q.text.trim(),
          choices: q.choices
            .filter((c) => c.text.trim() !== "")
            .map((c) => ({
              text: c.text.trim(),
              is_correct: c.is_correct,
            })),
          order: q.order,
        })),
      };

      await createTestApi(testData);
      toast.success("Test muvaffaqiyatli yaratildi");
      navigate("/testlar");
    } catch (error) {
      console.error("Error creating test:", error);

      // Handle field-specific errors from backend
      const errorData = error?.responseData || {};
      const errorMessage =
        error?.message || "Test yaratishda xatolik yuz berdi";

      // Check if errorData contains field-specific errors (object with field names as keys)
      const hasFieldErrors =
        typeof errorData === "object" &&
        errorData !== null &&
        !Array.isArray(errorData) &&
        !errorData.detail &&
        !errorData.message &&
        Object.keys(errorData).length > 0;

      if (hasFieldErrors) {
        // Map field names to user-friendly labels
        const fieldLabels = {
          title: "Test nomi",
          duration: "Vaqt",
          pass_score: "O'tish foizi",
          max_violations: "Maksimal buzilishlar",
          vacancy_id: "Vakansiya",
          vacancy_ids: "Vakansiyalar",
          is_active: "Faol holati",
          questions: "Savollar",
        };

        // Display each field error
        Object.keys(errorData).forEach((field) => {
          const fieldError = errorData[field];
          if (fieldError) {
            // Handle both string and array of strings
            const errorText = Array.isArray(fieldError)
              ? fieldError.join(", ")
              : fieldError;

            const fieldLabel = fieldLabels[field] || field;
            toast.error(`${fieldLabel}: ${errorText}`, {
              duration: 5000,
            });
          }
        });
      } else {
        // Show generic error if no field-specific errors were found
        toast.error(errorMessage);
      }
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
            onClick={() => navigate("/testlar")}
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
              Yangi test yaratish
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Test ma'lumotlarini to'ldiring
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Test nomi *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Test nomini kiriting"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Vaqt (daqiqa) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  disabled={loading}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="Masalan: 30"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                  daqiqa
                </span>
              </div>
            </div>

            {/* Pass Score */}
            <div>
              <label
                htmlFor="pass_score"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                O'tish foizi (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="pass_score"
                  name="pass_score"
                  value={formData.pass_score}
                  onChange={handleChange}
                  disabled={loading}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="Masalan: 70"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Max Violations */}
            <div>
              <label
                htmlFor="max_violations"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Maksimal buzilishlar *
              </label>
              <input
                type="number"
                id="max_violations"
                name="max_violations"
                value={formData.max_violations}
                onChange={handleChange}
                disabled={loading}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Masalan: 5"
                required
              />
            </div>

            {/* Vacancy IDs */}
            <div>
              <label
                htmlFor="vacancy_ids"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Vakansiyalar *{" "}
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  (bir nechtasini tanlash mumkin)
                </span>
              </label>
              <div
                id="vacancy-dropdown"
                className="relative"
              >
                {/* Custom Select Input */}
                <div
                  onClick={() => !loading && !loadingHierarchy && setIsVacancyDropdownOpen(!isVacancyDropdownOpen)}
                  className={`w-full min-h-[42px] px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer flex items-center flex-wrap gap-2 ${
                    loading || loadingHierarchy
                      ? "opacity-50 cursor-not-allowed"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  } ${
                    isVacancyDropdownOpen
                      ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {formData.vacancy_ids.length === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Vakansiyani tanlang
                    </span>
                  ) : (
                    formData.vacancy_ids.map((vacancyId) => {
                      const vacancyInfo = selectedVacancyInfo[vacancyId];
                      if (!vacancyInfo) return null;
                      return (
                        <span
                          key={vacancyId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm font-medium"
                        >
                          <span>{vacancyInfo.title}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVacancy(vacancyId);
                            }}
                            disabled={loading || loadingHierarchy}
                            className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5 transition-colors disabled:opacity-50"
                            title="O'chirish"
                          >
                            <svg
                              className="h-3.5 w-3.5"
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
                        </span>
                      );
                    })
                  )}
                  <div className="ml-auto flex items-center">
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        isVacancyDropdownOpen ? "rotate-180" : ""
                      }`}
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
                  </div>
                </div>

                {/* Dropdown Menu with Hierarchy */}
                {isVacancyDropdownOpen && !loadingHierarchy && hierarchyData && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-auto">
                    {(() => {
                      const currentView = getCurrentView();

                      // Breadcrumb Navigation
                      const renderBreadcrumb = () => {
                        if (navigationPath.length === 0) return null;

                        const breadcrumbItems = [];
                        
                        // Always start with root
                        breadcrumbItems.push({ label: "Bosh sahifa", path: [] });
                        
                        if (navigationPath[0] === "central") {
                          breadcrumbItems.push({ label: "Markaziy apparat", path: ["central"] });
                          if (navigationPath.length > 1) {
                            const deptIndex = parseInt(navigationPath[1]);
                            const dept = hierarchyData.central?.[deptIndex];
                            if (dept) {
                              breadcrumbItems.push({ label: dept.department_name_uz || dept.department_name || `Departament #${dept.department_id}`, path: ["central", deptIndex] });
                              if (navigationPath.length > 2) {
                                const mgmtIndex = parseInt(navigationPath[2]);
                                const mgmt = dept.managements?.[mgmtIndex];
                                if (mgmt) {
                                  breadcrumbItems.push({ label: mgmt.management_name_uz || mgmt.management_name || `Boshqarma #${mgmt.management_id}`, path: ["central", deptIndex, mgmtIndex] });
                                }
                              }
                            }
                          }
                        } else if (navigationPath[0] === "regional") {
                          breadcrumbItems.push({ label: "Hududiy boshqarma", path: ["regional"] });
                          if (navigationPath.length > 1) {
                            const regionIndex = parseInt(navigationPath[1]);
                            const region = hierarchyData.regional?.[regionIndex];
                            if (region) {
                              breadcrumbItems.push({ label: region.region, path: ["regional", regionIndex] });
                            }
                          }
                        }

                        return (
                          <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 px-4 py-2 flex items-center gap-2 flex-wrap">
                            {breadcrumbItems.map((item, idx) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && <span className="text-gray-400">/</span>}
                                <button
                                  type="button"
                                  onClick={() => navigateTo(item.path)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {item.label}
                                </button>
                              </React.Fragment>
                            ))}
                          </div>
                        );
                      };

                      // Root view - Central or Regional
                      if (!currentView || currentView.type === "root") {
                        return (
                          <>
                            {renderBreadcrumb()}
                            <div className="p-2 space-y-1">
                              {/* Central Option */}
                              {hierarchyData.central && hierarchyData.central.length > 0 && (
                                <div
                                  onClick={() => navigateTo(["central"])}
                                  className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center justify-between"
                                >
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Markaziy apparat
                                  </span>
                                  <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              )}

                              {/* Regional Option */}
                              {hierarchyData.regional && hierarchyData.regional.length > 0 && (
                                <div
                                  onClick={() => navigateTo(["regional"])}
                                  className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center justify-between"
                                >
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Hududiy boshqarma
                                  </span>
                                  <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      }

                      // Central departments view
                      if (currentView.type === "central") {
                        return (
                          <>
                            {renderBreadcrumb()}
                            <div className="p-2 space-y-1">
                              {hierarchyData.central?.map((dept, deptIndex) => {
                                const allIds = getAllVacancyIds(dept);
                                const allSelected = allIds.length > 0 && allIds.every((id) => formData.vacancy_ids.includes(id));
                                const hasManagements = dept.managements && dept.managements.length > 0;

                                return (
                                  <div
                                    key={deptIndex}
                                    className="border border-gray-200 dark:border-gray-600 rounded-md"
                                  >
                                    <div
                                      onClick={hasManagements ? () => navigateTo(["central", deptIndex]) : undefined}
                                      className={`px-4 py-3 flex items-center justify-between ${hasManagements ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" : ""}`}
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={allSelected}
                                          onChange={() => toggleAllVacancies(dept, `Markaziy apparat > ${dept.department_name_uz || dept.department_name || `Departament #${dept.department_id}`}`, dept.department_name_uz || dept.department_name || `Departament #${dept.department_id}`)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                          {dept.department_name_uz || dept.department_name || `Departament #${dept.department_id}`}
                                        </span>
                                      </div>
                                      {hasManagements && (
                                        <svg
                                          className="h-5 w-5 text-gray-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }

                      // Department managements view
                      if (currentView.type === "department") {
                        const { department, deptIndex } = currentView;
                        return (
                          <>
                            {renderBreadcrumb()}
                            <div className="p-2 space-y-1">
                              {/* Department level vacancies */}
                              {department.vacancies && department.vacancies.length > 0 && (
                                <div className="mb-3">
                                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                    Departament vakansiyalari
                                  </div>
                                  {department.vacancies.map((vacancy) => {
                                    const isSelected = formData.vacancy_ids.includes(vacancy.id);
                                    return (
                                      <div
                                        key={vacancy.id}
                                        onClick={() => handleVacancyToggle(vacancy.id, vacancy.title_uz || vacancy.title || `Vakansiya #${vacancy.id}`, `Markaziy apparat > ${department.department_name_uz || department.department_name || `Departament #${department.department_id}`}`)}
                                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between ${
                                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                        }`}
                                      >
                                        <span className={`text-sm ${isSelected ? "text-blue-900 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                                          {vacancy.title_uz || vacancy.title || `Vakansiya #${vacancy.id}`}
                                        </span>
                                        {isSelected && (
                                          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Managements */}
                              {department.managements?.map((mgmt, mgmtIndex) => {
                                const allIds = getAllVacancyIds(mgmt);
                                const allSelected = allIds.length > 0 && allIds.every((id) => formData.vacancy_ids.includes(id));
                                const hasVacancies = mgmt.vacancies && mgmt.vacancies.length > 0;

                                return (
                                  <div key={mgmtIndex} className="border border-gray-200 dark:border-gray-600 rounded-md">
                                    <div
                                      onClick={hasVacancies ? () => navigateTo(["central", deptIndex, mgmtIndex]) : undefined}
                                      className={`px-4 py-3 flex items-center justify-between ${hasVacancies ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" : ""}`}
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={allSelected}
                                          onChange={() => toggleAllVacancies(mgmt, `Markaziy apparat > ${department.department_name_uz || department.department_name || `Departament #${department.department_id}`} > ${mgmt.management_name_uz || mgmt.management_name || `Boshqarma #${mgmt.management_id}`}`, mgmt.management_name_uz || mgmt.management_name || `Boshqarma #${mgmt.management_id}`)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                          {mgmt.management_name_uz || mgmt.management_name || `Boshqarma #${mgmt.management_id}`}
                                        </span>
                                      </div>
                                      {hasVacancies && (
                                        <svg
                                          className="h-5 w-5 text-gray-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }

                      // Management vacancies view
                      if (currentView.type === "management") {
                        const { department, management } = currentView;
                        return (
                          <>
                            {renderBreadcrumb()}
                            <div className="p-2 space-y-1">
                              {management.vacancies?.map((vacancy) => {
                                const isSelected = formData.vacancy_ids.includes(vacancy.id);
                                return (
                                  <div
                                    key={vacancy.id}
                                    onClick={() => handleVacancyToggle(vacancy.id, vacancy.title_uz || vacancy.title || `Vakansiya #${vacancy.id}`, `Markaziy apparat > ${department.department_name_uz || department.department_name || `Departament #${department.department_id}`} > ${management.management_name_uz || management.management_name || `Boshqarma #${management.management_id}`}`)}
                                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between ${
                                      isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                    }`}
                                  >
                                    <span className={`text-sm ${isSelected ? "text-blue-900 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                                      {vacancy.title_uz || vacancy.title || `Vakansiya #${vacancy.id}`}
                                    </span>
                                    {isSelected && (
                                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }

                      // Regional view
                      if (currentView.type === "regional") {
                        return (
                          <>
                            {renderBreadcrumb()}
                            <div className="p-2 space-y-1">
                              {hierarchyData.regional?.map((region, regionIndex) => {
                                const allIds = getAllVacancyIds(region);
                                const allSelected = allIds.length > 0 && allIds.every((id) => formData.vacancy_ids.includes(id));
                                const hasVacancies = region.vacancies && region.vacancies.length > 0;

                                return (
                                  <div key={regionIndex} className="border border-gray-200 dark:border-gray-600 rounded-md">
                                    <div
                                      onClick={hasVacancies ? () => navigateTo(["regional", regionIndex]) : undefined}
                                      className={`px-4 py-3 flex items-center justify-between ${hasVacancies ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" : ""}`}
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={allSelected}
                                          onChange={() => toggleAllVacancies(region, `Hududiy boshqarma > ${region.region}`, region.region)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                          {region.region}
                                        </span>
                                      </div>
                                      {hasVacancies && (
                                        <svg
                                          className="h-5 w-5 text-gray-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }

                      // Region vacancies view
                      if (currentView.type === "region") {
                        const { region } = currentView;
                        return (
                          <>
                            {renderBreadcrumb()}
                            <div className="p-2 space-y-1">
                              {region.vacancies?.map((vacancy) => {
                                const isSelected = formData.vacancy_ids.includes(vacancy.id);
                                return (
                                  <div
                                    key={vacancy.id}
                                    onClick={() => handleVacancyToggle(vacancy.id, vacancy.title_uz || vacancy.title || `Vakansiya #${vacancy.id}`, `Hududiy boshqarma > ${region.region}`)}
                                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between ${
                                      isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                    }`}
                                  >
                                    <span className={`text-sm ${isSelected ? "text-blue-900 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                                      {vacancy.title_uz || vacancy.title || `Vakansiya #${vacancy.id}`}
                                    </span>
                                    {isSelected && (
                                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }

                      return null;
                    })()}
                  </div>
                )}

                {/* Loading State */}
                {loadingHierarchy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <svg
                      className="animate-spin h-5 w-5 text-blue-600"
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
                  </div>
                )}
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center pt-6">
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
                Test faol
              </label>
            </div>
          </div>

          {/* Questions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Savollar
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Test savollarini va javob variantlarini qo'shing
                </p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <svg
                  className="h-4 w-4 text-blue-600 dark:text-blue-400"
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
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formData.questions.length} ta savol
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {formData.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-base font-bold shadow-sm">
                        {questionIndex + 1}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          Savol {questionIndex + 1}
                        </h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {
                              question.choices.filter((c) => c.text.trim())
                                .length
                            }{" "}
                            ta variant
                          </p>
                          {question.is_multiple_choice && (
                            <span className="px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded">
                              Ko'p variantlik
                            </span>
                          )}
                          {question.image && (
                            <span className="px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center space-x-1">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Rasm</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        disabled={loading}
                        title="Savolni o'chirish"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Question Settings */}
                  <div className="mb-4 flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.is_multiple_choice || false}
                        onChange={(e) =>
                          handleQuestionChange(
                            questionIndex,
                            "is_multiple_choice",
                            e.target.checked
                          )
                        }
                        disabled={loading}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ko'p variantlik savol (bir nechta to'g'ri javob)
                      </span>
                    </label>
                  </div>

                  {/* Question Text */}
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Savol matni *
                    </label>
                    <textarea
                      value={question.text}
                      onChange={(e) =>
                        handleQuestionChange(
                          questionIndex,
                          "text",
                          e.target.value
                        )
                      }
                      disabled={loading}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-colors"
                      placeholder="Savol matnini kiriting..."
                      required
                    />
                  </div>

                  {/* Question Image */}
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Savol rasmi (ixtiyoriy)
                    </label>
                    {question.image ? (
                      <div className="relative">
                        <img
                          src={question.image}
                          alt="Question preview"
                          className="w-full max-h-64 object-contain rounded-lg border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(questionIndex)}
                          disabled={loading}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                          title="Rasmni o'chirish"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-10 h-10 mb-3 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Rasm yuklash</span>{" "}
                            yoki sudrab tashlang
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF (max. 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(questionIndex, e)}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Choices */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Javob variantlari *
                        </label>
                        {question.is_multiple_choice && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Bir nechta to'g'ri javob belgilash mumkin
                          </p>
                        )}
                        {!question.is_multiple_choice && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Faqat 1 ta to'g'ri javob belgilash mumkin
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addChoice(questionIndex)}
                        disabled={loading}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Variant qo'shish</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {question.choices.map((choice, choiceIndex) => (
                        <div
                          key={choiceIndex}
                          className={`flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all ${
                            choice.is_correct
                              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                              : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={choice.is_correct}
                                onChange={(e) =>
                                  handleChoiceChange(
                                    questionIndex,
                                    choiceIndex,
                                    "is_correct",
                                    e.target.checked
                                  )
                                }
                                disabled={loading}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                                title="To'g'ri javobni belgilash"
                              />
                              {choice.is_correct && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={choice.text}
                                onChange={(e) =>
                                  handleChoiceChange(
                                    questionIndex,
                                    choiceIndex,
                                    "text",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-colors ${
                                  choice.is_correct
                                    ? "border-green-300 dark:border-green-600"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder={`Variant ${choiceIndex + 1}...`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {choice.is_correct && (
                              <span className="px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 rounded-md">
                                To'g'ri
                              </span>
                            )}
                            {question.choices.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeChoice(questionIndex, choiceIndex)
                                }
                                disabled={loading}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Variantni o'chirish"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Question Button */}
              <button
                type="button"
                onClick={addQuestion}
                disabled={loading}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50 group"
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
                    <svg
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
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
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Yangi savol qo'shish
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Savol va javob variantlarini qo'shing
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/testlar")}
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
              {loading ? "Yaratilmoqda..." : "Test yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTest;
