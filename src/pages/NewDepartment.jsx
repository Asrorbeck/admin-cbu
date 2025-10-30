import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createDepartmentApi } from "../utils/api";

const NewDepartment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    department_tasks: [{ task: "" }], // Start with one empty task
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Yangi bo'lim - Markaziy Bank Administratsiyasi";
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTaskChange = (index, value) => {
    const updatedTasks = [...formData.department_tasks];
    updatedTasks[index].task = value;
    setFormData({
      ...formData,
      department_tasks: updatedTasks,
    });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      department_tasks: [...formData.department_tasks, { task: "" }],
    });
  };

  const removeTask = (index) => {
    if (formData.department_tasks.length > 1) {
      const updatedTasks = formData.department_tasks.filter(
        (_, i) => i !== index
      );
      setFormData({
        ...formData,
        department_tasks: updatedTasks,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const filteredTasks = formData.department_tasks.filter(
        (task) => task.task.trim() !== ""
      );

      if (filteredTasks.length === 0) {
        toast.error("Kamida bitta vazifa kiriting");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        department_tasks: filteredTasks,
      };

      await toast.promise(createDepartmentApi(payload), {
        loading: "Saqlanmoqda...",
        success: "Yangi bo'lim muvaffaqiyatli qo'shildi",
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
      <div className="max-w-4xl mx-auto">
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
                  Bo'lim ma'lumotlari
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Yangi bo'lim uchun zarur ma'lumotlarni to'ldiring
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Department Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
                >
                  Bo'lim nomi *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Masalan: Axborot texnologiyalari bo'limi"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
              >
                Bo'lim tavsifi *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                placeholder="Bo'limning asosiy vazifalari, maqsadi va faoliyat yo'nalishlarini batafsil yozing..."
                required
              />
            </div>

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Bo'lim vazifalari *
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.department_tasks.length} ta vazifa
                </span>
              </div>

              <div className="space-y-4">
                {formData.department_tasks.map((task, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={task.task}
                          onChange={(e) =>
                            handleTaskChange(index, e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                          placeholder={`Vazifa ${
                            index + 1
                          }: Bo'limning asosiy vazifalaridan birini batafsil yozing...`}
                        />
                      </div>
                      {formData.department_tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="flex-shrink-0 mt-2 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTask}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
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
                    <span className="text-sm font-medium">
                      Yangi vazifa qo'shish
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
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
