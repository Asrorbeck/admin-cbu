import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DepartmentsTable from "../components/tables/DepartmentsTable";
import { getDepartmentsApi, deleteDepartmentApi } from "../utils/api";
import toast from "react-hot-toast";

const Departments = () => {
  const [departmentsData, setDepartmentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch departments from API
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartmentsApi();
      setDepartmentsData(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError(error.message);
      toast.error("Bo'limlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (updatedData) => {
    try {
      // Update department via API
      // await updateDepartmentApi(updatedData.id, updatedData);

      // For now, update locally
      setDepartmentsData((prev) =>
        prev.map((dept) =>
          dept.id === updatedData.id ? { ...dept, ...updatedData } : dept
        )
      );
      toast.success("Bo'lim muvaffaqiyatli yangilandi");
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Bo'limni yangilashda xatolik yuz berdi");
    }
  };

  const handleDelete = async (departmentId) => {
    try {
      await deleteDepartmentApi(departmentId);
      setDepartmentsData((prev) =>
        prev.filter((dept) => dept.id !== departmentId)
      );
      toast.success("Bo'lim muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Bo'limni o'chirishda xatolik yuz berdi");
    }
  };

  const handleViewDetails = (departmentId) => {
    // Navigation will be handled by React Router
    window.location.href = `/departments/${departmentId}`;
  };

  // Loading state
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

  // Error state
  if (error) {
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
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchDepartments}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bo'limlar
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Tashkilot bo'limlarini boshqaring
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Add Department Button */}
          <Link
            to="/departments/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              className="h-4 w-4 mr-2"
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
            Yangi bo'lim qo'shish
          </Link>
        </div>
      </div>

      {/* Content */}
      {departmentsData.length === 0 ? (
        <div className="text-center py-12">
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Bo'limlar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Birinchi bo'limni qo'shish uchun tugmani bosing.
          </p>
        </div>
      ) : (
        <DepartmentsTable
          departments={departmentsData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
};

export default Departments;
