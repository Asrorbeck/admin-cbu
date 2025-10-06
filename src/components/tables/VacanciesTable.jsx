import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import toast from "react-hot-toast";
import EditVacancyModal from "../modals/EditVacancyModal";
import { updateVacancy, deleteVacancy } from "../../data/sampleData";

const VacanciesTable = ({ vacancies, departmentId, onEdit, onDelete }) => {
  const [editingVacancy, setEditingVacancy] = useState(null);

  const handleEdit = (vacancy) => {
    setEditingVacancy(vacancy);
  };

  const handleSaveEdit = (updatedData) => {
    const success = updateVacancy(departmentId, editingVacancy.id, updatedData);
    if (success) {
      toast.success("Vakansiya muvaffaqiyatli yangilandi");
      onEdit(updatedData);
      setEditingVacancy(null);
    } else {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = (vacancy) => {
    confirmAlert({
      title: "Vakansiyani o'chirish",
      message: `"${vacancy.position}" vakansiyasini o'chirishni xohlaysizmi?`,
      buttons: [
        {
          label: "Bekor qilish",
          onClick: () => {
            console.log("Delete cancelled");
          },
        },
        {
          label: "O'chirish",
          onClick: () => {
            console.log("Delete confirmed");
            const success = deleteVacancy(departmentId, vacancy.id);
            if (success) {
              toast.success("Vakansiya muvaffaqiyatli o'chirildi");
              onDelete(vacancy.id);
            } else {
              toast.error("Xatolik yuz berdi");
            }
          },
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
      willUnmount: () => {},
    });
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  T/r
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lavozim nomi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Maosh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Holati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vacancies.map((vacancy, index) => (
                <tr
                  key={vacancy.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {vacancy.position}
                    </div>
                    {vacancy.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {vacancy.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {parseInt(vacancy.salary).toLocaleString()} so'm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vacancy.status === "Active"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {vacancy.status === "Active" ? "Faol" : "Nofaol"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(vacancy)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Tahrirlash"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(vacancy)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="O'chirish"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingVacancy && (
        <EditVacancyModal
          vacancy={editingVacancy}
          onSave={handleSaveEdit}
          onClose={() => setEditingVacancy(null)}
        />
      )}
    </>
  );
};

export default VacanciesTable;
