import { useState } from "react";
import { latinToCyrillic } from "../../utils/transliterate";

const EditDepartmentModal = ({ department, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    id: department.id,
    name_uz: department.name_uz || department.name || "",
    name_cr: department.name_cr || "",
    name_ru: department.name_ru || "",
    department_tasks_uz: (department.department_tasks_uz && department.department_tasks_uz.length > 0)
      ? department.department_tasks_uz
      : (department.department_tasks && department.department_tasks.length > 0
          ? department.department_tasks
          : [{ task: "" }]) || [{ task: "" }],
    department_tasks_cr: (department.department_tasks_cr && department.department_tasks_cr.length > 0)
      ? department.department_tasks_cr
      : [{ task: "" }],
    department_tasks_ru: (department.department_tasks_ru && department.department_tasks_ru.length > 0)
      ? department.department_tasks_ru
      : [{ task: "" }],
  });
  
  const [manualEditFlags, setManualEditFlags] = useState({
    name_cr: false,
    tasks_cr: {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const filteredTasksUz = (formData.department_tasks_uz || []).filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredTasksCr = (formData.department_tasks_cr || []).filter(
      (t) => (t.task || "").trim() !== ""
    );
    const filteredTasksRu = (formData.department_tasks_ru || []).filter(
      (t) => (t.task || "").trim() !== ""
    );
    onSave({
      id: formData.id,
      name_uz: formData.name_uz,
      name_cr: formData.name_cr,
      name_ru: formData.name_ru,
      department_tasks_uz: filteredTasksUz,
      department_tasks_cr: filteredTasksCr,
      department_tasks_ru: filteredTasksRu,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-transliterate name_uz to name_cr
    if (name === 'name_uz' && !manualEditFlags.name_cr) {
      setFormData({
        ...formData,
        [name]: value,
        name_cr: latinToCyrillic(value),
      });
    } else {
      // If editing name_cr, mark as manually edited
      if (name === 'name_cr') {
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
    const updated = [...formData[fieldName]];
    updated[index] = { task: value };
    
    // Auto-transliterate Uzbek Latin tasks to Cyrillic
    if (lang === 'uz') {
      const taskKey = `task_${index}`;
      const isManuallyEdited = manualEditFlags.tasks_cr[taskKey] || false;
      
      if (!isManuallyEdited) {
        const cyrillicTasks = [...formData.department_tasks_cr];
        if (cyrillicTasks[index]) {
          cyrillicTasks[index] = { task: latinToCyrillic(value) };
        }
        setFormData({ 
          ...formData, 
          [fieldName]: updated,
          department_tasks_cr: cyrillicTasks,
        });
        return;
      }
    }
    
    // If Cyrillic task is being edited, mark as manually edited
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
    
    setFormData({ ...formData, [fieldName]: updated });
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
    if (formData[fieldName].length <= 1) return;
    setFormData({
      ...formData,
      [fieldName]: formData[fieldName].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Departamentni tahrirlash
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Department Names - Multilingual */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Departament nomi (3 tilda) *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="name_uz"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  O'zbekcha *
                </label>
                <input
                  type="text"
                  id="name_uz"
                  name="name_uz"
                  value={formData.name_uz}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="name_cr"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  O'zbekcha (Kirill)
                </label>
                <input
                  type="text"
                  id="name_cr"
                  name="name_cr"
                  value={formData.name_cr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="name_ru"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Ruscha
                </label>
                <input
                  type="text"
                  id="name_ru"
                  name="name_ru"
                  value={formData.name_ru}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tasks Section - Multilingual */}
          {['uz', 'cr', 'ru'].map((lang) => {
            const langNames = { uz: "O'zbekcha", cr: "O'zbekcha (Kirill)", ru: "Ruscha" };
            const tasksField = `department_tasks_${lang}`;
            const tasks = formData[tasksField] || [];
            
            return (
              <div key={lang}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {langNames[lang]} vazifalari {lang === 'uz' && '*'}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tasks.length} ta vazifa
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <textarea
                            value={task.task}
                            onChange={(e) =>
                              handleTaskChange(lang, index, e.target.value)
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder={`Vazifa ${index + 1}`}
                          />
                        </div>
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(lang, index)}
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
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addTask(lang)}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Yangi vazifa qo'shish ({langNames[lang]})
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
