import { useState } from "react";
import { createSurveyQuestionApi } from "../../utils/api";
import toast from "react-hot-toast";

const NewQuestionModal = ({ isOpen, onClose, surveyId, onSuccess }) => {
  const [formData, setFormData] = useState({
    survey: surveyId,
    order: 1,
    text: "",
    text_ru: "",
    question_type: "single",
    choices: [{ text: "", text_ru: "" }],
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleChoiceChange = (index, field, value) => {
    setFormData((prev) => {
      const newChoices = [...prev.choices];
      newChoices[index] = {
        ...newChoices[index],
        [field]: value,
      };
      return { ...prev, choices: newChoices };
    });
  };

  const addChoice = () => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { text: "", text_ru: "" }],
    }));
  };

  const removeChoice = (index) => {
    if (formData.choices.length > 1) {
      setFormData((prev) => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      toast.error("Savol matni (O'zbek) kiritilishi shart");
      return;
    }

    // Filter out empty choices
    const validChoices = formData.choices.filter(
      (choice) => choice.text.trim() !== "" || choice.text_ru.trim() !== ""
    );

    // For single/multiple choice types, require at least one choice
    if (
      (formData.question_type === "single" ||
        formData.question_type === "multiple") &&
      validChoices.length === 0
    ) {
      toast.error("Kamida bitta variant qo'shish kerak");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        survey: surveyId,
        order: formData.order || 1,
        text: formData.text.trim(),
        text_ru: formData.text_ru.trim() || formData.text.trim(),
        question_type: formData.question_type,
        choices:
          formData.question_type === "single" ||
          formData.question_type === "multiple"
            ? validChoices.map((choice) => ({
                text: choice.text.trim(),
                text_ru: choice.text_ru.trim() || choice.text.trim(),
              }))
            : [],
      };

      await toast.promise(createSurveyQuestionApi(payload), {
        loading: "Saqlanmoqda...",
        success: "Savol muvaffaqiyatli qo'shildi",
        error: (err) => err?.message || "Xatolik yuz berdi",
      });

      // Reset form
      setFormData({
        survey: surveyId,
        order: 1,
        text: "",
        text_ru: "",
        question_type: "single",
        choices: [{ text: "", text_ru: "" }],
      });

      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Yangi savol qo'shish
            </h2>
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
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="order"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tartib raqami *
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                disabled={loading}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label
                htmlFor="question_type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Savol turi *
              </label>
              <select
                id="question_type"
                name="question_type"
                value={formData.question_type}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              >
                <option value="single">Bitta tanlov</option>
                <option value="multiple">Ko'p tanlov</option>
                <option value="text">Matn</option>
                <option value="number">Raqam</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="text"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Savol matni (O'zbek) *
            </label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Savol matnini kiriting"
              required
            />
          </div>

          <div>
            <label
              htmlFor="text_ru"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Savol matni (Rus) *
            </label>
            <textarea
              id="text_ru"
              name="text_ru"
              value={formData.text_ru}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Savol matnini rus tilida kiriting"
              required
            />
          </div>

          {/* Choices section - only for single and multiple choice types */}
          {(formData.question_type === "single" ||
            formData.question_type === "multiple") && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Variantlar *
                </label>
                <button
                  type="button"
                  onClick={addChoice}
                  disabled={loading}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  + Variant qo'shish
                </button>
              </div>
              <div className="space-y-3">
                {formData.choices.map((choice, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/40"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Variant {index + 1}
                      </span>
                      {formData.choices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChoice(index)}
                          disabled={loading}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
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
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) =>
                          handleChoiceChange(index, "text", e.target.value)
                        }
                        disabled={loading}
                        placeholder="Variant matni (O'zbek)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={choice.text_ru}
                        onChange={(e) =>
                          handleChoiceChange(index, "text_ru", e.target.value)
                        }
                        disabled={loading}
                        placeholder="Variant matni (Rus)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewQuestionModal;

