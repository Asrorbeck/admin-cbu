import { useState } from "react";
import { Link } from "react-router-dom";
import DepartmentsTable from "../components/tables/DepartmentsTable";
import DepartmentsCards from "../components/cards/DepartmentsCards";
import { departments } from "../data/sampleData";

const Departments = () => {
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [departmentsData, setDepartmentsData] = useState(departments);

  const handleEdit = (updatedData) => {
    setDepartmentsData((prev) =>
      prev.map((dept) =>
        dept.id === updatedData.id ? { ...dept, ...updatedData } : dept
      )
    );
  };

  const handleDelete = (departmentId) => {
    setDepartmentsData((prev) =>
      prev.filter((dept) => dept.id !== departmentId)
    );
  };

  const handleViewDetails = (departmentId) => {
    // Navigation will be handled by React Router
    window.location.href = `/departments/${departmentId}`;
  };

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
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
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
                  d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "card"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </button>
          </div>

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
            + Yangi bo'lim qo'shish
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
        <>
          {viewMode === "table" ? (
            <DepartmentsTable
              departments={departmentsData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <DepartmentsCards
              departments={departmentsData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Departments;
