import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import VacanciesTable from "../components/tables/VacanciesTable";
import VacanciesCards from "../components/cards/VacanciesCards";
import {
  getDepartmentById,
  getVacanciesByDepartmentId,
} from "../data/sampleData";

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("table");
  const [department, setDepartment] = useState(null);
  const [vacancies, setVacancies] = useState([]);

  useEffect(() => {
    const dept = getDepartmentById(id);
    const deptVacancies = getVacanciesByDepartmentId(id);

    if (dept) {
      setDepartment(dept);
      setVacancies(deptVacancies);
    } else {
      navigate("/departments");
    }
  }, [id, navigate]);

  const handleEdit = (updatedData) => {
    setVacancies((prev) =>
      prev.map((vacancy) =>
        vacancy.id === updatedData.id ? { ...vacancy, ...updatedData } : vacancy
      )
    );
  };

  const handleDelete = (vacancyId) => {
    setVacancies((prev) => prev.filter((vacancy) => vacancy.id !== vacancyId));
  };

  if (!department) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/departments")}
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
              Departament: {department.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Vakansiyalar va lavozimlar
            </p>
          </div>
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

          {/* Add Vacancy Button */}
          <Link
            to={`/departments/${id}/new-vacancy`}
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
            + Yangi vakansiya qo'shish
          </Link>
        </div>
      </div>

      {/* Department Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vazifalari:
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {department.responsibilities}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Majburiyatlari:
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {department.obligations}
            </p>
          </div>
        </div>
      </div>

      {/* Vacancies */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vakansiyalar
        </h2>

        {vacancies.length === 0 ? (
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Vakansiyalar yo'q
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Birinchi vakansiyani qo'shish uchun tugmani bosing.
            </p>
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              <VacanciesTable
                vacancies={vacancies}
                departmentId={id}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <VacanciesCards
                vacancies={vacancies}
                departmentId={id}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentDetails;
