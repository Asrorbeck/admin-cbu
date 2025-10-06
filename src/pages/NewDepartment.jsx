import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addDepartment } from "../data/sampleData";

const NewDepartment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    responsibilities: "",
    obligations: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addDepartment(formData);
      toast.success("Yangi bo'lim muvaffaqiyatli qo'shildi");
      navigate("/departments");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate("/departments")}
          className="text-gray-600 hover:text-gray-900 mb-4"
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
        <h1 className="text-2xl font-bold text-gray-900">
          Yangi bo'lim qo'shish
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Yangi bo'lim ma'lumotlarini kiriting
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Bo'lim nomi *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masalan: Axborot texnologiyalari bo'limi"
              required
            />
          </div>

          <div>
            <label
              htmlFor="responsibilities"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Vazifalari *
            </label>
            <textarea
              id="responsibilities"
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bo'limning asosiy vazifalarini kiriting..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="obligations"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Majburiyatlari *
            </label>
            <textarea
              id="obligations"
              name="obligations"
              value={formData.obligations}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bo'limning majburiyatlarini kiriting..."
              required
            />
          </div>

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/departments")}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
            >
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDepartment;
