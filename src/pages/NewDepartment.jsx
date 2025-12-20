import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createDepartmentApi } from "../utils/api";
import { latinToCyrillic } from "../utils/transliterate";

const NewDepartment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name_uz: "",
    name_cr: "",
    name_ru: "",
    department_tasks_uz: [{ task: "" }], // Start with one empty task
    department_tasks_cr: [{ task: "" }],
    department_tasks_ru: [{ task: "" }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualEditFlags, setManualEditFlags] = useState({
    name_cr: false,
    tasks_cr: {},
  });

  useEffect(() => {
    document.title = "Yangi departament - Markaziy Bank Administratsiyasi";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-transliterate name_uz to name_cr
    if (name === "name_uz" && !manualEditFlags.name_cr) {
      setFormData({
        ...formData,
        [name]: value,
        name_cr: latinToCyrillic(value),
      });
    } else {
      // If editing name_cr, mark as manually edited
      if (name === "name_cr") {
        setManualEditFlags((prev) => ({
          ...prev,
          name_cr: true,
        }));
      }
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleTaskChange = (lang, index, value) => {
    const fieldName = `department_tasks_${lang}`;
    const updatedTasks = [...formData[fieldName]];
    updatedTasks[index] = { task: value };

    // Auto-transliterate Uzbek Latin tasks to Cyrillic
    if (lang === "uz") {
      const taskKey = `task_${index}`;
      const isManuallyEdited = manualEditFlags.tasks_cr[taskKey] || false;

      if (!isManuallyEdited) {
        const cyrillicTasks = [...formData.department_tasks_cr];
        if (cyrillicTasks[index]) {
          cyrillicTasks[index] = { task: latinToCyrillic(value) };
        }
        setFormData({
          ...formData,
          [fieldName]: updatedTasks,
          department_tasks_cr: cyrillicTasks,
        });
        return;
      }
    }

    // If Cyrillic task is being edited, mark as manually edited
    if (lang === "cr") {
      const taskKey = `task_${index}`;
      setManualEditFlags((prev) => ({
        ...prev,
        tasks_cr: {
          ...prev.tasks_cr,
          [taskKey]: true,
        },
      }));
    }

    setFormData({
      ...formData,
      [fieldName]: updatedTasks,
    });
  };

  const addTask = (lang) => {
    const fieldName = `department_tasks_${lang}`;
    setFormData({
      ...formData,
      [fieldName]: [...formData[fieldName], { task: "" }],
    });
  };

  const removeTask = (lang, index) => {
    const fieldName = `department_tasks_${lang}`;
    if (formData[fieldName].length > 1) {
      const updatedTasks = formData[fieldName].filter((_, i) => i !== index);
      setFormData({
        ...formData,
        [fieldName]: updatedTasks,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const filteredTasksUz = formData.department_tasks_uz.filter(
        (task) => task.task.trim() !== ""
      );
      const filteredTasksCr = formData.department_tasks_cr.filter(
        (task) => task.task.trim() !== ""
      );
      const filteredTasksRu = formData.department_tasks_ru.filter(
        (task) => task.task.trim() !== ""
      );

      if (
        filteredTasksUz.length === 0 &&
        filteredTasksCr.length === 0 &&
        filteredTasksRu.length === 0
      ) {
        toast.error("Kamida bitta tilda vazifa kiriting");
        setIsSubmitting(false);
        return;
      }

      if (
        !formData.name_uz.trim() &&
        !formData.name_cr.trim() &&
        !formData.name_ru.trim()
      ) {
        toast.error("Kamida bitta tilda nom kiriting");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name_uz: formData.name_uz,
        name_cr: formData.name_cr,
        name_ru: formData.name_ru,
        department_tasks_uz: filteredTasksUz,
        department_tasks_cr: filteredTasksCr,
        department_tasks_ru: filteredTasksRu,
      };

      await toast.promise(createDepartmentApi(payload), {
        loading: "Saqlanmoqda...",
        success: "Yangi departament muvaffaqiyatli qo'shildi",
        error: (err) => err?.message || "Xatolik yuz berdi",
      });

      navigate("/departments");
    } catch (error) {
      console.error("Error creating department:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Departament ma'lumotlari
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Yangi departament uchun zarur ma'lumotlarni to'ldiring
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-8">
            {/* Department Names - Multilingual */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Departament nomi (3 tilda) *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div>
                  <label
                    htmlFor="name_uz"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    O'zbekcha *
                  </label>
                  <input
                    type="text"
                    id="name_uz"
                    name="name_uz"
                    value={formData.name_uz}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all"
                    placeholder="Masalan: Axborot texnologiyalari departamenti"
                  />
                </div>
                <div>
                  <label
                    htmlFor="name_cr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    O'zbekcha (Kirill)
                  </label>
                  <input
                    type="text"
                    id="name_cr"
                    name="name_cr"
                    value={formData.name_cr}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all"
                    placeholder="O'zbekcha (Kirill) nom"
                  />
                </div>
                <div>
                  <label
                    htmlFor="name_ru"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ruscha
                  </label>
                  <input
                    type="text"
                    id="name_ru"
                    name="name_ru"
                    value={formData.name_ru}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all"
                    placeholder="Русское название"
                  />
                </div>
              </div>
            </div>

            {/* Tasks Section - Multilingual */}
            {["uz", "cr", "ru"].map((lang) => {
              const langNames = {
                uz: "O'zbekcha",
                cr: "O'zbekcha (Kirill)",
                ru: "Ruscha",
              };
              const tasksField = `department_tasks_${lang}`;
              const tasks = formData[tasksField] || [];

              return (
                <div key={lang} className="space-y-4">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <label className="block text-base font-semibold text-gray-900 dark:text-white">
                      {langNames[lang]} vazifalari {lang === "uz" && "*"}
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {tasks.length} ta vazifa
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 gap-2"
                      >
                        <div className="flex-shrink-0 pt-3">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={task.task}
                            onChange={(e) =>
                              handleTaskChange(lang, index, e.target.value)
                            }
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none transition-all"
                            placeholder={`Vazifa ${
                              index + 1
                            }: Departamentning asosiy vazifalaridan birini batafsil yozing...`}
                          />
                        </div>
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(lang, index)}
                            className="flex-shrink-0 pt-3 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
                      onClick={() => addTask(lang)}
                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 lg:p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                    >
                      <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        <svg
                          className="h-5 w-5 group-hover:scale-110 transition-transform"
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
                        <span className="text-sm font-medium">
                          Yangi vazifa qo'shish ({langNames[lang]})
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Form Actions */}
            <div className="pt-6 lg:pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/departments")}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors border border-gray-300 dark:border-gray-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
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
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewDepartment;
