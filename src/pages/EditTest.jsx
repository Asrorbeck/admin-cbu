import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTestByIdApi, updateTestApi, getVacanciesApi } from "../utils/api";
import toast from "react-hot-toast";

const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vacancies, setVacancies] = useState([]);
  const [loadingVacancies, setLoadingVacancies] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    duration_minutes: "",
    max_violations: "",
    vacancy_id: "",
    is_active: true,
    questions: [],
  });

  useEffect(() => {
    document.title = "Testni tahrirlash - Markaziy Bank Administratsiyasi";
    fetchTest();
    fetchVacancies();
  }, [id]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const testData = await getTestByIdApi(id);
      
      // Extract vacancy_id - check multiple possible fields
      let vacancyId = "";
      if (testData.vacancy_id) {
        vacancyId = String(testData.vacancy_id);
      } else if (testData.job?.id) {
        vacancyId = String(testData.job.id);
      } else if (testData.job && typeof testData.job === 'number') {
        vacancyId = String(testData.job);
      }
      
      // Map backend data to form data
      setFormData({
        title: testData.title || "",
        duration_minutes: testData.duration_minutes || "",
        max_violations: testData.max_violations || "",
        vacancy_id: vacancyId,
        is_active: testData.is_active ?? true,
        questions: testData.questions?.map((q, index) => ({
          id: q.id,
          text: q.text || "",
          choices: q.choices?.map((c) => ({
            id: c.id,
            text: c.text || "",
            is_correct: c.is_correct || false,
          })) || [],
          order: index + 1,
        })) || [],
      });
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Test ma'lumotlarini yuklashda xatolik yuz berdi");
      navigate("/testlar");
    } finally {
      setLoading(false);
    }
  };

  const fetchVacancies = async () => {
    try {
      setLoadingVacancies(true);
      const data = await getVacanciesApi();
      const vacanciesArray = Array.isArray(data) 
        ? data 
        : (data?.results || data?.data || []);
      setVacancies(vacanciesArray);
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      toast.error("Vakansiyalarni yuklashda xatolik yuz berdi");
      setVacancies([]);
    } finally {
      setLoadingVacancies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
        },
      ],
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

    if (!formData.duration_minutes || formData.duration_minutes < 1) {
      toast.error("Vaqt kiritilishi shart");
      return;
    }

    if (!formData.max_violations || formData.max_violations < 0) {
      toast.error("Maksimal buzilishlar soni kiritilishi shart");
      return;
    }

    if (!formData.vacancy_id) {
      toast.error("Vakansiya tanlanishi shart");
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
        toast.error(`${i + 1}-savol uchun to'g'ri javob belgilanishi kerak`);
        return;
      }
    }

    try {
      setSaving(true);

      const testData = {
        title: formData.title.trim(),
        duration_minutes: parseInt(formData.duration_minutes),
        max_violations: parseInt(formData.max_violations),
        vacancy_id: formData.vacancy_id && formData.vacancy_id.trim() !== "" 
          ? parseInt(formData.vacancy_id) 
          : null,
        is_active: formData.is_active,
        questions: validQuestions.map((q) => ({
          id: q.id, // Include id for existing questions
          text: q.text.trim(),
          choices: q.choices
            .filter((c) => c.text.trim() !== "")
            .map((c) => ({
              id: c.id, // Include id for existing choices
              text: c.text.trim(),
              is_correct: c.is_correct,
            })),
          order: q.order,
        })),
      };

      await updateTestApi(id, testData);
      toast.success("Test muvaffaqiyatli yangilandi");
      navigate("/testlar");
    } catch (error) {
      console.error("Error updating test:", error);
      
      const errorData = error?.responseData || {};
      const errorMessage = error?.message || "Test yangilashda xatolik yuz berdi";
      
      const hasFieldErrors = 
        typeof errorData === 'object' && 
        errorData !== null && 
        !Array.isArray(errorData) &&
        !errorData.detail &&
        !errorData.message &&
        Object.keys(errorData).length > 0;
      
      if (hasFieldErrors) {
        const fieldLabels = {
          title: "Test nomi",
          duration_minutes: "Vaqt",
          max_violations: "Maksimal buzilishlar",
          vacancy_id: "Vakansiya",
          is_active: "Faol holati",
          questions: "Savollar",
        };
        
        Object.keys(errorData).forEach((field) => {
          const fieldError = errorData[field];
          if (fieldError) {
            const errorText = Array.isArray(fieldError) 
              ? fieldError.join(', ') 
              : fieldError;
            
            const fieldLabel = fieldLabels[field] || field;
            toast.error(`${fieldLabel}: ${errorText}`, {
              duration: 5000,
            });
          }
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
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
              Testni tahrirlash
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Test ma'lumotlarini yangilang
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
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Test nomini kiriting"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="duration_minutes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Vaqt (daqiqa) *
              </label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                disabled={saving}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Masalan: 30"
                required
              />
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
                disabled={saving}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Masalan: 5"
                required
              />
            </div>

            {/* Vacancy ID */}
            <div>
              <label
                htmlFor="vacancy_id"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Vakansiya *
              </label>
              <select
                id="vacancy_id"
                name="vacancy_id"
                value={formData.vacancy_id}
                onChange={handleChange}
                disabled={saving || loadingVacancies}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              >
                <option value="">Vakansiyani tanlang</option>
                {vacancies.map((vacancy) => (
                  <option key={vacancy.id} value={vacancy.id}>
                    {vacancy.title || `Vakansiya #${vacancy.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Is Active */}
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={saving}
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
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Savollar
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formData.questions.length} ta savol
              </span>
            </div>

            <div className="space-y-6">
              {formData.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                        {questionIndex + 1}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Savol {questionIndex + 1}
                      </h4>
                    </div>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        disabled={saving}
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

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      disabled={saving}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      placeholder="Savol matnini kiriting"
                      required
                    />
                  </div>

                  {/* Choices */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Variantlar *
                      </label>
                      <button
                        type="button"
                        onClick={() => addChoice(questionIndex)}
                        disabled={saving}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        + Variant qo'shish
                      </button>
                    </div>

                    {question.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600"
                      >
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
                          disabled={saving}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
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
                            disabled={saving}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                            placeholder={`Variant ${choiceIndex + 1}`}
                          />
                        </div>
                        {question.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeChoice(questionIndex, choiceIndex)
                            }
                            disabled={saving}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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
                        )}
                        {choice.is_correct && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            To'g'ri
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add Question Button */}
              <button
                type="button"
                onClick={addQuestion}
                disabled={saving}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm font-medium">Yangi savol qo'shish</span>
                </div>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/testlar")}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving && (
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
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTest;

