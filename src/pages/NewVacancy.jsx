import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createVacancyApi } from "../utils/api";
import toast from "react-hot-toast";

const NewVacancy = () => {
  const { id } = useParams(); // management ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    job_tasks: "",
    is_active: true,
    application_deadline: "",
    test_scheduled_at: "",
    management: parseInt(id),
    branch_type: "",
    region: "",
    requirements_eng: "",
    requirements_ru: "",
  });

  useEffect(() => {
    document.title = "Yangi vakansiya - Markaziy Bank Administratsiyasi";
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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

    if (!formData.title.trim()) {
      toast.error("Vakansiya nomi kiritilishi shart");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Vakansiya tavsifi kiritilishi shart");
      return;
    }

    if (!formData.requirements.trim()) {
      toast.error("Talablar kiritilishi shart");
      return;
    }

    if (!formData.job_tasks.trim()) {
      toast.error("Ish vazifalari kiritilishi shart");
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
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        job_tasks: formData.job_tasks.trim(),
        is_active: formData.is_active,
        application_deadline: formData.application_deadline,
        management_id: formData.management,
        branch_type: formData.branch_type,
        region: formData.branch_type === "central" ? null : formData.region,
        ...(formData.test_scheduled_at && {
          test_scheduled_at: formatDateTimeWithTimezone(
            formData.test_scheduled_at
          ),
        }),
        ...(formData.requirements_eng && {
          requirements_eng: formData.requirements_eng,
        }),
        ...(formData.requirements_ru && {
          requirements_ru: formData.requirements_ru,
        }),
      };

      console.log("Sending vacancy data:", vacancyData);
      console.log("API endpoint:", "/vacancies/");

      await createVacancyApi(vacancyData);

      toast.success("Vakansiya muvaffaqiyatli yaratildi");
      navigate(`/management/${id}`);
    } catch (error) {
      console.error("Error creating vacancy:", error);
      if (error.message.includes("404")) {
        toast.error(
          "Vakansiya API hozircha mavjud emas. Backend da endpoint qo'shish kerak."
        );
      } else {
        toast.error("Vakansiya yaratishda xatolik yuz berdi");
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Vakansiya nomi *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Vakansiya nomini kiriting"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Vakansiya tavsifi *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Vakansiya tavsifini kiriting"
              required
            />
          </div>

          {/* Requirements */}
          <div>
            <label
              htmlFor="requirements"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Talablar *
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Nomzodlar uchun talablarni kiriting"
              required
            />
          </div>

          {/* Job Tasks */}
          <div>
            <label
              htmlFor="job_tasks"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Ish vazifalari *
            </label>
            <textarea
              id="job_tasks"
              name="job_tasks"
              value={formData.job_tasks}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Ish vazifalarini kiriting"
              required
            />
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
                htmlFor="requirements_eng"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Talab qilinadigan ingliz tili
              </label>
              <select
                id="requirements_eng"
                name="requirements_eng"
                value={formData.requirements_eng}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">Tanlang</option>
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
                htmlFor="requirements_ru"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Talab qilinadigan rus tili
              </label>
              <select
                id="requirements_ru"
                name="requirements_ru"
                value={formData.requirements_ru}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">Tanlang</option>
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
