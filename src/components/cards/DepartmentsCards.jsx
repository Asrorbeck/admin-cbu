import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import toast from "react-hot-toast";
import EditDepartmentModal from "../modals/EditDepartmentModal";
import { updateDepartment, deleteDepartment } from "../../data/sampleData";

const DepartmentsCards = ({ departments, onEdit, onDelete, onViewDetails }) => {
  const [editingDepartment, setEditingDepartment] = useState(null);

  const handleEdit = (department) => {
    setEditingDepartment(department);
  };

  const handleSaveEdit = (updatedData) => {
    const success = updateDepartment(editingDepartment.id, updatedData);
    if (success) {
      toast.success("Departament muvaffaqiyatli yangilandi");
      onEdit(updatedData);
      setEditingDepartment(null);
    } else {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = (department) => {
    confirmAlert({
      title: "Departamentni o'chirish",
            message: `"${department.name}" departamentini o'chirishni xohlaysizmi?`,
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
            const success = deleteDepartment(department.id);
            if (success) {
              toast.success("Departament muvaffaqiyatli o'chirildi");
              onDelete(department.id);
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
        {departments.map((department) => (
          <div
            key={department.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {department.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(department)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
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
                  onClick={() => handleDelete(department)}
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
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
                <button
                  onClick={() => onViewDetails(department.id)}
                  className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1"
                  title="Tafsilotlar"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vazifalari:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {department.responsibilities}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Majburiyatlari:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {department.obligations}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingDepartment && (
        <EditDepartmentModal
          department={editingDepartment}
          onSave={handleSaveEdit}
          onClose={() => setEditingDepartment(null)}
        />
      )}
    </>
  );
};

export default DepartmentsCards;
