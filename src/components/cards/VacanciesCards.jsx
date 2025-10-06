import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import toast from "react-hot-toast";
import EditVacancyModal from "../modals/EditVacancyModal";
import { updateVacancy, deleteVacancy } from "../../data/sampleData";

const VacanciesCards = ({ vacancies, departmentId, onEdit, onDelete }) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vacancies.map((vacancy) => (
          <div
            key={vacancy.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {vacancy.position}
              </h3>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  vacancy.status === "Active"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}
              >
                {vacancy.status === "Active" ? "Faol" : "Nofaol"}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maosh:
                </h4>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {parseInt(vacancy.salary).toLocaleString()} so'm
                </p>
              </div>
              {vacancy.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tavsif:
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vacancy.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(vacancy)}
                className="flex-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(vacancy)}
                className="flex-1 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                O'chirish
              </button>
            </div>
          </div>
        ))}
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

export default VacanciesCards;
