import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSurveyByIdApi,
  getSurveyQuestionsApi,
  deleteSurveyQuestionApi,
} from "../utils/api";
import toast from "react-hot-toast";
import NewQuestionModal from "../components/modals/NewQuestionModal";

const SurveyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSurveyAndQuestions();
    document.title = "So'rovnoma tafsilotlari - Markaziy Bank Administratsiyasi";
  }, [id]);

  const fetchSurveyAndQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const [surveyData, questionsData] = await Promise.all([
        getSurveyByIdApi(id),
        getSurveyQuestionsApi(), // Get all questions, then filter by survey ID
      ]);

      setSurvey(surveyData);
      
      // Filter questions by survey ID
      const surveyId = parseInt(id, 10);
      const filteredQuestions = Array.isArray(questionsData)
        ? questionsData.filter((q) => q.survey === surveyId)
        : [];
      
      setQuestions(filteredQuestions);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Bu savolni o'chirishni xohlaysizmi?")) {
      return;
    }

    try {
      await toast.promise(deleteSurveyQuestionApi(questionId), {
        loading: "O'chirilmoqda...",
        success: "Savol muvaffaqiyatli o'chirildi",
        error: (err) => err?.message || "O'chirishda xatolik yuz berdi",
      });
      fetchSurveyAndQuestions();
    } catch (error) {
      // Error handled by toast
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      single: "Bitta tanlov",
      multiple: "Ko'p tanlov",
      text: "Matn",
      number: "Raqam",
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      monthly: "Oylik",
      weekly: "Haftalik",
      daily: "Kunlik",
      yearly: "Yillik",
    };
    return labels[frequency] || frequency;
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

  if (error || !survey) {
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
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {error || "So'rovnoma topilmadi"}
        </p>
        <button
          onClick={() => navigate("/sorovnomalar")}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Orqaga qaytish
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
            onClick={() => navigate("/sorovnomalar")}
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
              {survey.title}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Chastota: {getFrequencyLabel(survey.frequency)} |{" "}
              {survey.is_active ? (
                <span className="text-green-600 dark:text-green-400">Faol</span>
              ) : (
                <span className="text-gray-500">Nofaol</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg
            className="h-5 w-5 mr-2"
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
          Yangi savol qo'shish
        </button>
      </div>

      {/* Questions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Savollar ({questions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Savollar yo'q
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Birinchi savolni qo'shish uchun tugmani bosing.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tartib
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Savol matni
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Savol matni (RU)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Turi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Variantlar soni
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {questions
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((question) => (
                    <tr
                      key={question.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {question.order || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {question.text || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {question.text_ru || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {getQuestionTypeLabel(question.question_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {question.choices?.length || 0} ta
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => handleDelete(question.id, e)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="O'chirish"
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
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Question Modal */}
      <NewQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        surveyId={parseInt(id, 10)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchSurveyAndQuestions();
        }}
      />
    </div>
  );
};

export default SurveyDetails;

