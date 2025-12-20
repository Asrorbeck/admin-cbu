import { useState, useEffect } from "react";
import { updateManagementApi } from "../../utils/api";
import { latinToCyrillic } from "../../utils/transliterate";
import toast from "react-hot-toast";

const EditManagementModal = ({ isOpen, onClose, management, onSuccess }) => {
  const [formData, setFormData] = useState({
    name_uz: "",
    name_cr: "",
    name_ru: "",
    department: "",
  });
  const [manualEditFlags, setManualEditFlags] = useState({
    name_cr: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (management && isOpen) {
      setFormData({
        name_uz: management.name_uz || management.name || "",
        name_cr: management.name_cr || "",
        name_ru: management.name_ru || "",
        department: management.department || "",
      });
      // Check if name_cr was manually edited (if it exists and doesn't match transliteration)
      if (management.name_cr && management.name_uz) {
        const autoTransliterated = latinToCyrillic(management.name_uz);
        setManualEditFlags({
          name_cr: management.name_cr !== autoTransliterated,
        });
      }
    }
  }, [management, isOpen]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name_uz.trim()) {
      toast.error("Boshqarma nomi (O'zbekcha) kiritilishi shart");
      return;
    }

    try {
      setLoading(true);

      const updatedData = {
        name_uz: formData.name_uz.trim(),
        name_cr: formData.name_cr.trim(),
        name_ru: formData.name_ru.trim(),
        department: parseInt(formData.department),
      };

      await updateManagementApi(management.id, updatedData);

      toast.success("Boshqarma muvaffaqiyatli yangilandi");
      onSuccess(updatedData);
      onClose();
    } catch (error) {
      console.error("Error updating management:", error);
      toast.error("Boshqarmani yangilashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Boshqarmani tahrirlash
            </h2>
            <button
              onClick={handleClose}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Management Name - Multilingual */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Boshqarma nomi (3 tilda) *
              </h3>
              <div className="space-y-4">
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
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    placeholder="O'zbekcha nom"
                    required
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
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    placeholder="Русское название"
                  />
                </div>
              </div>
            </div>

            {/* Department ID (hidden) */}
            <input
              type="hidden"
              name="department"
              value={formData.department}
            />

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
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
                {loading ? "Yangilanmoqda..." : "Yangilash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditManagementModal;
