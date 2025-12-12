import { useState } from "react";

const EditDepartmentModal = ({ department, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    id: department.id,
    name: department.name || "",
    description: department.description || "",
    department_tasks: (department.department_tasks &&
    department.department_tasks.length > 0
      ? department.department_tasks
      : [{ task: "" }]) || [{ task: "" }],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const filteredTasks = (formData.department_tasks || []).filter(
      (t) => (t.task || "").trim() !== ""
    );
    onSave({
      id: formData.id,
      name: formData.name,
      description: formData.description,
      department_tasks: filteredTasks,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTaskChange = (index, value) => {
    const updated = [...formData.department_tasks];
    updated[index] = { task: value };
    setFormData({ ...formData, department_tasks: updated });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      department_tasks: [...formData.department_tasks, { task: "" }],
    });
  };

  const removeTask = (index) => {
    if (formData.department_tasks.length <= 1) return;
    setFormData({
      ...formData,
      department_tasks: formData.department_tasks.filter((_, i) => i !== index),
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
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Departament nomi
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Departament tavsifi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Departament vazifalari
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formData.department_tasks.length} ta vazifa
              </span>
            </div>

            <div className="space-y-3">
              {formData.department_tasks.map((task, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={task.task}
                        onChange={(e) =>
                          handleTaskChange(index, e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder={`Vazifa ${index + 1}`}
                      />
                    </div>
                    {formData.department_tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
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
                onClick={addTask}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Yangi vazifa qo'shish
              </button>
            </div>
          </div>

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
