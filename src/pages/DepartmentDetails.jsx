import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ManagementTable from "../components/tables/ManagementTable";
import EditManagementModal from "../components/modals/EditManagementModal";
import EditDepartmentModal from "../components/modals/EditDepartmentModal";
import NewManagementModal from "../components/modals/NewManagementModal";
import {
  getDepartmentApi,
  getManagementApi,
  updateDepartmentApi,
  deleteManagementApi,
} from "../utils/api";
import toast from "react-hot-toast";

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState({
    name: "",
    description: "",
    department_tasks: [], // Initialize with empty array
  });
  const [management, setManagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedManagement, setSelectedManagement] = useState(null);
  const [isDeptEditOpen, setIsDeptEditOpen] = useState(false);
  const [isNewMgmtOpen, setIsNewMgmtOpen] = useState(false);

  useEffect(() => {
    fetchDepartmentAndManagement();
    document.title = "Departament tafsilotlari - Markaziy Bank Administratsiyasi";
  }, [id]);

  const fetchDepartmentAndManagement = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch department data
      const departmentData = await getDepartmentApi(id);

      // Ensure department_tasks is always an array
      const normalizedData = {
        ...departmentData,
        department_tasks: Array.isArray(departmentData.department_tasks)
          ? departmentData.department_tasks
          : [],
      };

      setDepartment(normalizedData);

      // Fetch management data filtered by department ID
      const filteredManagement = await getManagementApi(id);
      // Handle paginated response format: { results: [...], count: ... }
      const managementArray = Array.isArray(filteredManagement) 
        ? filteredManagement 
        : (filteredManagement?.results || filteredManagement?.data || []);
      setManagement(managementArray);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (managementItem) => {
    setSelectedManagement(managementItem);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedData) => {
    setManagement((prev) =>
      prev.map((item) =>
        item.id === selectedManagement.id ? { ...item, ...updatedData } : item
      )
    );
    setSelectedManagement(null);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedManagement(null);
  };

  const handleOpenDepartmentEdit = () => {
    setIsDeptEditOpen(true);
  };

  const handleDepartmentEditSave = async (updatedData) => {
    const payload = {
      name: updatedData.name,
      description: updatedData.description,
      department_tasks: (updatedData.department_tasks || []).filter(
        (t) => (t.task || "").trim() !== ""
      ),
    };

    try {
      await toast.promise(updateDepartmentApi(department.id, payload), {
        loading: "Yangilanmoqda...",
        success: "Departament muvaffaqiyatli yangilandi",
        error: (err) =>
          err?.message || "Departamentni yangilashda xatolik yuz berdi",
      });

      setDepartment((prev) => ({ ...prev, ...payload }));
      setIsDeptEditOpen(false);
    } catch (e) {
      // keep modal open on error
    }
  };

  const handleDelete = async (managementId) => {
    const tId = toast.loading("O'chirilmoqda...");
    try {
      await deleteManagementApi(managementId);
      setManagement((prev) => prev.filter((item) => item.id !== managementId));
      toast.success("Boshqarma muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting management:", error);
      toast.error(error.message || "Boshqarmani o'chirishda xatolik yuz berdi");
    } finally {
      toast.dismiss(tId);
    }
  };

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
          onClick={fetchDepartmentAndManagement}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (!department) {
    navigate("/departments");
    return null;
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
              Boshqarmalar va tashkilotlar
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            type="button"
            onClick={handleOpenDepartmentEdit}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Tahrirlash
          </button>
        </div>
      </div>

      {/* Department Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Bo'lim tavsifi:
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
              {department.description}
            </p>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Departament vazifalari ({department.department_tasks?.length || 0} ta):
            </h3>
            <div className="space-y-3">
              {(department?.department_tasks || []).map((task, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                    {task.task}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Boshqarmalar
          </h2>
          <button
            type="button"
            onClick={() => setIsNewMgmtOpen(true)}
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
            Yangi boshqarma qo'shish
          </button>
        </div>

        {management.length === 0 ? (
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
              Boshqarmalar yo'q
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Birinchi boshqarmani qo'shish uchun tugmani bosing.
            </p>
          </div>
        ) : (
          <ManagementTable
            management={management}
            departmentId={id}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Edit Management Modal */}
      <EditManagementModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        management={selectedManagement}
        onSuccess={handleEditSuccess}
      />

      {/* Edit Department Modal */}
      {isDeptEditOpen && (
        <EditDepartmentModal
          department={department}
          onSave={handleDepartmentEditSave}
          onClose={() => setIsDeptEditOpen(false)}
        />
      )}

      {/* New Management Modal */}
      <NewManagementModal
        isOpen={isNewMgmtOpen}
        onClose={() => setIsNewMgmtOpen(false)}
        departmentId={id}
        onSuccess={(payload) => {
          setManagement((prev) => [
            ...prev,
            {
              id: Math.max(0, ...prev.map((m) => m.id || 0)) + 1, // fallback local id
              name: payload.name,
              management_functions: payload.management_functions,
              department: payload.department,
            },
          ]);
        }}
      />
    </div>
  );
};

export default DepartmentDetails;
