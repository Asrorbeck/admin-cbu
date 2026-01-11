import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDepartmentsApi,
  getManagementApi,
  getVacanciesApi,
  getApplicationsApi,
  getUrgentTestApplicationsApi,
  getApplicationByIdApi,
  updateApplicationApi,
  deleteApplicationApi,
} from "../utils/api";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/modals/ConfirmDialog";

// Regions data with display names
const REGIONS = [
  { value: "toshkent", label: "Toshkent" },
  { value: "qashqadaryo", label: "Qashqadaryo" },
  { value: "samarqand", label: "Samarqand" },
  { value: "navoiy", label: "Navoiy" },
  { value: "andijon", label: "Andijon" },
  { value: "fargona", label: "Farg'ona" },
  { value: "namangan", label: "Namangan" },
  { value: "surxondaryo", label: "Surxondaryo" },
  { value: "sirdaryo", label: "Sirdaryo" },
  { value: "jizzax", label: "Jizzax" },
  { value: "buxoro", label: "Buxoro" },
  { value: "xorazm", label: "Xorazm" },
  { value: "qoraqalpogiston", label: "Qoraqalpog'iston Respublikasi" },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    departments: 0,
    management: 0,
    vacancies: 0,
    applications: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Urgent test applications state
  const [urgentApplications, setUrgentApplications] = useState([]);
  const [urgentLoading, setUrgentLoading] = useState(true);
  const [urgentPage, setUrgentPage] = useState(1);
  const [urgentPageSize, setUrgentPageSize] = useState(10);
  const [urgentPaginationInfo, setUrgentPaginationInfo] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [urgentSearchQuery, setUrgentSearchQuery] = useState("");
  const [urgentJshshirQuery, setUrgentJshshirQuery] = useState("");
  const [urgentSelectedIds, setUrgentSelectedIds] = useState(new Set());
  const [urgentBulkStatus, setUrgentBulkStatus] = useState("NEW");
  const [isUrgentBulkUpdating, setIsUrgentBulkUpdating] = useState(false);
  const [isUrgentModalOpen, setIsUrgentModalOpen] = useState(false);
  const [urgentModalLoading, setUrgentModalLoading] = useState(false);
  const [selectedUrgentApplication, setSelectedUrgentApplication] =
    useState(null);
  const [urgentStatusValue, setUrgentStatusValue] = useState("NEW");
  const [savingUrgentStatus, setSavingUrgentStatus] = useState(false);
  const [urgentDeleteConfirmOpen, setUrgentDeleteConfirmOpen] = useState(false);
  const [deletingUrgentApplicationId, setDeletingUrgentApplicationId] =
    useState(null);
  const [isDeletingUrgent, setIsDeletingUrgent] = useState(false);
  const [activeTitleTab, setActiveTitleTab] = useState("uz");
  const [activeRequirementsTab, setActiveRequirementsTab] = useState("uz");
  const [activeJobTasksTab, setActiveJobTasksTab] = useState("uz");
  const [activeRegionTitleTab, setActiveRegionTitleTab] = useState("uz");

  useEffect(() => {
    fetchStats();
    fetchUrgentApplications();
    document.title = "Bosh sahifa - Markaziy Bank Administratsiyasi";
  }, []);

  useEffect(() => {
    setUrgentPage(1);
  }, [urgentSearchQuery, urgentJshshirQuery]);

  useEffect(() => {
    fetchUrgentApplications();
  }, [urgentPage, urgentPageSize, urgentSearchQuery, urgentJshshirQuery]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [departments, management, vacancies, applications] =
        await Promise.all([
          getDepartmentsApi(),
          getManagementApi(),
          getVacanciesApi(),
          getApplicationsApi(),
        ]);

      // Handle paginated response format: { results: [...], count: ... }
      const departmentsArray = Array.isArray(departments)
        ? departments
        : departments?.results || departments?.data || [];
      const managementArray = Array.isArray(management)
        ? management
        : management?.results || management?.data || [];
      const vacanciesArray = Array.isArray(vacancies)
        ? vacancies
        : vacancies?.results || vacancies?.data || [];
      const applicationsArray = Array.isArray(applications)
        ? applications
        : applications?.results || applications?.data || [];

      // For departments and applications, use count if available (paginated response), otherwise use array length
      const departmentsCount =
        departments?.count !== undefined
          ? departments.count
          : departmentsArray.length;

      const applicationsCount =
        applications?.count !== undefined
          ? applications.count
          : applicationsArray.length;

      setStats({
        departments: departmentsCount,
        management: 14,
        vacancies: vacanciesArray.length,
        applications: applicationsCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Statistikalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchUrgentApplications = async () => {
    try {
      setUrgentLoading(true);

      const params = {
        page: urgentPage,
        page_size: urgentPageSize,
      };

      if (urgentSearchQuery.trim()) {
        params.full_name = urgentSearchQuery.trim();
      }

      if (urgentJshshirQuery.trim()) {
        params.jshshir = urgentJshshirQuery.trim();
      }

      const applicationsData = await getUrgentTestApplicationsApi(params);
      const applicationsArray = Array.isArray(applicationsData)
        ? applicationsData
        : applicationsData?.results || applicationsData?.data || [];
      setUrgentApplications(applicationsArray);

      if (applicationsData && !Array.isArray(applicationsData)) {
        setUrgentPaginationInfo({
          count: applicationsData.count || 0,
          next: applicationsData.next,
          previous: applicationsData.previous,
        });
      } else {
        setUrgentPaginationInfo({
          count: applicationsArray.length,
          next: null,
          previous: null,
        });
      }

      setUrgentSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching urgent applications:", error);
      toast.error(
        "Test muddati yaqinlashgan arizalarni yuklashda xatolik yuz berdi"
      );
      setUrgentApplications([]);
      setUrgentPaginationInfo({
        count: 0,
        next: null,
        previous: null,
      });
    } finally {
      setUrgentLoading(false);
    }
  };

  // Helper functions from Arizalar.jsx
  const parseDateSafe = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    const date = parseDateSafe(dateString);
    if (!date) return "Ma'lumot yo'q";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const formatDateYearMonth = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    const date = parseDateSafe(dateString);
    if (!date) return "Ma'lumot yo'q";

    const year = date.getFullYear();
    const monthNames = [
      "yanvar",
      "fevral",
      "mart",
      "aprel",
      "may",
      "iyun",
      "iyul",
      "avgust",
      "sentabr",
      "oktabr",
      "noyabr",
      "dekabr",
    ];
    const month = monthNames[date.getMonth()];
    return `${year}-yil, ${month}`;
  };

  const calculateAge = (dateString) => {
    const dob = parseDateSafe(dateString);
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return Math.max(0, age);
  };

  const diffInMonths = (from, to) => {
    const a = parseDateSafe(from);
    const b = parseDateSafe(to) || new Date();
    if (!a || !b) return 0;
    const years = b.getFullYear() - a.getFullYear();
    const months = b.getMonth() - a.getMonth();
    let total = years * 12 + months;
    if (b.getDate() < a.getDate()) total -= 1;
    return Math.max(0, total);
  };

  const getTotalExperienceMonths = (employments) => {
    if (!Array.isArray(employments) || employments.length === 0) return 0;
    return employments.reduce(
      (sum, e) => sum + diffInMonths(e.date_from, e.date_to),
      0
    );
  };

  const formatExperience = (months) => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0 && m === 0) return "≈ 0 oy";
    if (y === 0) return `≈ ${m} oy`;
    if (m === 0) return `≈ ${y} yil`;
    return `≈ ${y} yil ${m} oy`;
  };

  const translateLanguageDegree = (degree) => {
    if (!degree) return degree;
    const lower = degree.toLowerCase();
    if (lower === "excellent") return "A'lo";
    if (lower === "beginner") return "Boshlang'ich";
    if (lower === "intermediate") return "O'rta";
    if (lower === "advanced") return "Yuqori";
    return degree;
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + "...";
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "test_scheduled") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Qabul qilindi
        </span>
      );
    }
    if (s === "rejected_docs" || s === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Rad etildi
        </span>
      );
    }
    if (s === "pending" || s === "new" || s === "reviewing") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Kutilmoqda
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        Kutilmoqda
      </span>
    );
  };

  // Urgent applications handlers
  const handleUrgentViewDetails = async (applicationId) => {
    try {
      setIsUrgentModalOpen(true);
      setUrgentModalLoading(true);
      // Reset tabs to default
      setActiveTitleTab("uz");
      setActiveRequirementsTab("uz");
      setActiveJobTasksTab("uz");
      setActiveRegionTitleTab("uz");
      const fullData = await getApplicationByIdApi(applicationId);
      setSelectedUrgentApplication(fullData);
      const normalizedStatus = (fullData?.status || "NEW").toUpperCase();
      // If status is "NEW", default to "REVIEWING" since "NEW" is not available in the select
      const mappedStatus =
        normalizedStatus === "PENDING"
          ? "REVIEWING"
          : normalizedStatus === "NEW"
          ? "REVIEWING"
          : normalizedStatus;
      setUrgentStatusValue(mappedStatus);
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Ariza ma'lumotlarini yuklashda xatolik yuz berdi");
      setIsUrgentModalOpen(false);
    } finally {
      setUrgentModalLoading(false);
    }
  };

  const closeUrgentModal = () => {
    setIsUrgentModalOpen(false);
    setTimeout(() => setSelectedUrgentApplication(null), 300);
  };

  const handleUrgentSaveStatus = async () => {
    if (!selectedUrgentApplication) return;
    try {
      setSavingUrgentStatus(true);
      const fullPayload = {
        user_id:
          selectedUrgentApplication.user?.user_id ||
          selectedUrgentApplication.user_id,
        job: selectedUrgentApplication.job?.id || selectedUrgentApplication.job,
        full_name:
          selectedUrgentApplication.user?.full_name ||
          selectedUrgentApplication.full_name,
        data_of_birth: selectedUrgentApplication.data_of_birth,
        phone:
          selectedUrgentApplication.user?.phone_number ||
          selectedUrgentApplication.phone,
        additional_information:
          selectedUrgentApplication.additional_information,
        jshshir: selectedUrgentApplication.jshshir,
        monthly_salary: selectedUrgentApplication.monthly_salary,
        graduations: selectedUrgentApplication.graduations || [],
        employments: selectedUrgentApplication.employments || [],
        languages: selectedUrgentApplication.languages || [],
        status: urgentStatusValue,
      };

      await toast.promise(
        updateApplicationApi(selectedUrgentApplication.id, fullPayload),
        {
          loading: "Saqlanmoqda...",
          success: "Holat muvaffaqiyatli yangilandi",
          error: (err) =>
            err?.message || "Holatni yangilashda xatolik yuz berdi",
        }
      );

      setUrgentApplications((prev) =>
        prev.map((a) =>
          a.id === selectedUrgentApplication.id
            ? { ...a, status: urgentStatusValue }
            : a
        )
      );
      setSelectedUrgentApplication((prev) => ({
        ...prev,
        status: urgentStatusValue,
      }));

      closeUrgentModal();
    } finally {
      setSavingUrgentStatus(false);
    }
  };

  const handleUrgentToggleAll = (checked, visibleIds) => {
    setUrgentSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleUrgentToggleOne = (id, checked) => {
    setUrgentSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleUrgentBulkUpdate = async () => {
    if (urgentSelectedIds.size === 0) return;
    try {
      setIsUrgentBulkUpdating(true);
      const safeApplications = Array.isArray(urgentApplications)
        ? urgentApplications
        : [];
      const selectedApps = safeApplications.filter((a) =>
        urgentSelectedIds.has(a.id)
      );
      const jobsMap = new Map(selectedApps.map((a) => [a.id, a.job]));
      await toast.promise(
        Promise.all(
          selectedApps.map((a) =>
            updateApplicationApi(a.id, {
              user_id: a.user?.user_id || a.user_id,
              job: jobsMap.get(a.id)?.id || a.job?.id || a.job,
              full_name: a.user?.full_name || a.full_name,
              data_of_birth: a.data_of_birth,
              phone: a.user?.phone_number || a.phone,
              additional_information: a.additional_information,
              jshshir: a.jshshir,
              monthly_salary: a.monthly_salary,
              graduations: a.graduations || [],
              employments: a.employments || [],
              languages: a.languages || [],
              status: urgentBulkStatus,
            })
          )
        ),
        {
          loading: "Bir nechta arizalar yangilanmoqda...",
          success: "Holatlar muvaffaqiyatli yangilandi",
          error: "Bulk yangilashda xatolik yuz berdi",
        }
      );
      setUrgentApplications((prev) =>
        prev.map((a) =>
          urgentSelectedIds.has(a.id) ? { ...a, status: urgentBulkStatus } : a
        )
      );
      setUrgentSelectedIds(new Set());
    } finally {
      setIsUrgentBulkUpdating(false);
    }
  };

  const handleUrgentDeleteClick = (applicationId, e) => {
    e.stopPropagation();
    setDeletingUrgentApplicationId(applicationId);
    setUrgentDeleteConfirmOpen(true);
  };

  const handleUrgentDeleteConfirm = async () => {
    if (!deletingUrgentApplicationId) return;
    try {
      setIsDeletingUrgent(true);
      await toast.promise(deleteApplicationApi(deletingUrgentApplicationId), {
        loading: "O'chirilmoqda...",
        success: "Ariza muvaffaqiyatli o'chirildi",
        error: (err) => err?.message || "Arizani o'chirishda xatolik yuz berdi",
      });
      setUrgentApplications((prev) =>
        prev.filter((a) => a.id !== deletingUrgentApplicationId)
      );
      setUrgentDeleteConfirmOpen(false);
      setDeletingUrgentApplicationId(null);
    } catch (error) {
      console.error("Error deleting application:", error);
    } finally {
      setIsDeletingUrgent(false);
    }
  };

  const handleUrgentDeleteCancel = () => {
    setUrgentDeleteConfirmOpen(false);
    setDeletingUrgentApplicationId(null);
  };

  // Pagination helpers
  const urgentTotalItems = urgentPaginationInfo.count;
  const urgentTotalPages = Math.max(
    1,
    Math.ceil(urgentTotalItems / urgentPageSize)
  );
  const urgentCurrentPage = urgentPage;
  const urgentStartIndex = (urgentCurrentPage - 1) * urgentPageSize + 1;
  const urgentEndIndex = Math.min(
    urgentCurrentPage * urgentPageSize,
    urgentTotalItems
  );

  const getUrgentPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (urgentTotalPages <= maxVisible) {
      for (let i = 1; i <= urgentTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (urgentCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(urgentTotalPages);
      } else if (urgentCurrentPage >= urgentTotalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = urgentTotalPages - 3; i <= urgentTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = urgentCurrentPage - 1; i <= urgentCurrentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(urgentTotalPages);
      }
    }

    return pages;
  };

  const urgentVisibleApps = Array.isArray(urgentApplications)
    ? urgentApplications
    : [];
  const urgentAllVisibleSelected =
    urgentVisibleApps.length > 0 &&
    urgentVisibleApps.every((a) => urgentSelectedIds.has(a.id));
  const urgentSomeVisibleSelected =
    urgentVisibleApps.some((a) => urgentSelectedIds.has(a.id)) &&
    !urgentAllVisibleSelected;

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bosh sahifa
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Umumiy statistika va tezkor kirish
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Departments Card */}
        <div
          onClick={() => navigate("/central/departments")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Departamentlar
              </p>
              <p className="text-3xl font-bold">{stats.departments}</p>
              <p className="text-blue-100 text-xs mt-1">Faol departamentlar</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Management Card */}
        <div
          onClick={() => navigate("/region")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Hududiy Bosh Boshqarmalar
              </p>
              <p className="text-3xl font-bold">{stats.management}</p>
              <p className="text-blue-100 text-xs mt-1">Tashkilotlar</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Vacancies Card */}
        <div
          onClick={() => navigate("/vacancies")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Vakansiyalar</p>
              <p className="text-3xl font-bold">{stats.vacancies}</p>
              <p className="text-blue-100 text-xs mt-1">Ochiq pozitsiyalar</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Applications Card */}
        <div
          onClick={() => navigate("/arizalar")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Arizalar</p>
              <p className="text-3xl font-bold">{stats.applications}</p>
              <p className="text-blue-100 text-xs mt-1">Kelib tushgan</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Markaziy Apparat Card */}
        <div
          onClick={() => navigate("/central/departments")}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Markaziy Apparat
              </p>
              <p className="text-2xl font-bold mt-2">Departamentlar</p>
              <p className="text-blue-100 text-xs mt-1">
                Markaziy apparat departamentlari va vakansiyalari
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hududiy Bosh Boshqarmalar Card */}
        <div
          onClick={() => navigate("/region")}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 cursor-pointer hover:from-green-700 hover:to-green-800 transition-all duration-200 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Hududiy Bosh Boshqarmalar
              </p>
              <p className="text-2xl font-bold mt-2">Hududlar</p>
              <p className="text-green-100 text-xs mt-1">
                Hududiy boshqarmalar vakansiyalari
              </p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
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
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Test Applications Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test muddati yaqinlashgan arizalar ro'yxati
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Test muddati yaqinlashgan, lekin hali kutilayotgan holatdagi
            arizalar
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <input
                  type="text"
                  value={urgentSearchQuery}
                  onChange={(e) => {
                    setUrgentSearchQuery(e.target.value);
                    setUrgentPage(1);
                  }}
                  placeholder="Ism bo'yicha qidirish..."
                  className="w-48 px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {urgentSearchQuery ? (
                  <button
                    onClick={() => {
                      setUrgentSearchQuery("");
                      setUrgentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Tozalash"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : (
                  <svg
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={urgentJshshirQuery}
                  onChange={(e) => {
                    setUrgentJshshirQuery(e.target.value);
                    setUrgentPage(1);
                  }}
                  placeholder="JSHSHIR bo'yicha qidirish..."
                  className="w-48 px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {urgentJshshirQuery ? (
                  <button
                    onClick={() => {
                      setUrgentJshshirQuery("");
                      setUrgentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Tozalash"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : (
                  <svg
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Sahifa hajmi:
              </label>
              <select
                value={urgentPageSize}
                onChange={(e) => {
                  setUrgentPageSize(Number(e.target.value));
                  setUrgentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk toolbar */}
        {urgentSelectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md px-4 py-3 mb-4">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              Tanlangan: {urgentSelectedIds.size} ta ariza
            </div>
            <div className="flex items-center gap-3">
              <select
                value={urgentBulkStatus}
                onChange={(e) => setUrgentBulkStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                <option value="NEW">Yangi</option>
                <option value="REVIEWING">Kutilmoqda</option>
                <option value="TEST_SCHEDULED">Qabul qilindi</option>
                <option value="REJECTED_DOCS">Rad etildi</option>
              </select>
              <button
                onClick={handleUrgentBulkUpdate}
                disabled={isUrgentBulkUpdating}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUrgentBulkUpdating ? "Yangilanmoqda..." : "Holatni qo'llash"}
              </button>
            </div>
          </div>
        )}

        {/* Applications Table */}
        {urgentLoading ? (
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
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={urgentAllVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = urgentSomeVisibleSelected;
                        }}
                        onChange={(e) =>
                          handleUrgentToggleAll(
                            e.target.checked,
                            urgentVisibleApps.map((a) => a.id)
                          )
                        }
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      T/r
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      To'liq ism
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40 max-w-[180px]">
                      Ish o'rni
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Yosh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      JSHSHIR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ta'lim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tajriba
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Holati
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ariza vaqti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {urgentVisibleApps.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          Test muddati yaqinlashgan arizalar yo'q
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Hozircha test muddati yaqinlashgan arizalar mavjud
                          emas.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    urgentVisibleApps.map((application, index) => (
                      <tr
                        key={application.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleUrgentViewDetails(application.id)}
                      >
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (e.target.type !== "checkbox") {
                              const isSelected = urgentSelectedIds.has(
                                application.id
                              );
                              handleUrgentToggleOne(
                                application.id,
                                !isSelected
                              );
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={urgentSelectedIds.has(application.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleUrgentToggleOne(
                                application.id,
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {urgentStartIndex + index}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {application.user?.full_name ||
                              application.full_name ||
                              "Ma'lumot yo'q"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 w-40 max-w-[180px]">
                          <span
                            className="block overflow-hidden text-ellipsis"
                            title={
                              application.job?.title_uz ||
                              application.job?.title ||
                              ""
                            }
                          >
                            {truncateText(
                              application.job?.title_uz ||
                                application.job?.title ||
                                "—",
                              40
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {(() => {
                            const age = calculateAge(application.data_of_birth);
                            return age === null
                              ? "Ma'lumot yo'q"
                              : `${age} yosh`;
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {application.user?.phone_number ||
                            application.phone ||
                            "Ma'lumot yo'q"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {application.jshshir || "Ma'lumot yo'q"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {application.graduations &&
                            application.graduations.length > 0 ? (
                              <div>
                                <p className="font-medium">
                                  {application.graduations[0].university}
                                </p>
                                <p className="text-gray-500">
                                  {application.graduations[0].degree}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Ma'lumot yo'q
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatExperience(
                            getTotalExperienceMonths(application.employments)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(application.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDateTime(application.created_at)}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleUrgentViewDetails(application.id)
                              }
                              onClickCapture={(e) => e.stopPropagation()}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
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
                            <button
                              onClick={(e) =>
                                handleUrgentDeleteClick(application.id, e)
                              }
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination footer */}
            {urgentVisibleApps.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {urgentTotalItems === 0
                    ? "0 yozuv"
                    : `${urgentStartIndex}–${urgentEndIndex} / ${urgentTotalItems} yozuv`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={!urgentPaginationInfo.previous}
                    onClick={() => setUrgentPage((p) => Math.max(1, p - 1))}
                  >
                    Oldingi
                  </button>

                  <div className="flex items-center gap-1">
                    {getUrgentPageNumbers().map((pageNum, index) => {
                      if (pageNum === "ellipsis") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-sm text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }

                      const isActive = pageNum === urgentCurrentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setUrgentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-600"
                              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={!urgentPaginationInfo.next}
                    onClick={() => setUrgentPage((p) => p + 1)}
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Urgent Application Details Modal */}
      {isUrgentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => closeUrgentModal()}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ariza tafsilotlari
                  </h3>
                  <button
                    onClick={() => closeUrgentModal()}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
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
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                {urgentModalLoading ? (
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
                ) : selectedUrgentApplication ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Application Information */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Ariza ma'lumotlari
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            To'liq ism
                          </h4>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {selectedUrgentApplication.user?.full_name ||
                              selectedUrgentApplication.full_name ||
                              "Ma'lumot yo'q"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            Yosh
                          </h4>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {(() => {
                              const age = calculateAge(
                                selectedUrgentApplication.data_of_birth
                              );
                              return age === null
                                ? "Ma'lumot yo'q"
                                : `${age} yosh`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            Telefon
                          </h4>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {selectedUrgentApplication.user?.phone_number ||
                              selectedUrgentApplication.phone ||
                              "Ma'lumot yo'q"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            Qo'shimcha ma'lumot
                          </h4>
                          <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                            {selectedUrgentApplication.additional_information ||
                              "Ma'lumot yo'q"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ta'lim
                        </h4>
                        {selectedUrgentApplication.graduations?.length ? (
                          <div className="space-y-3">
                            {selectedUrgentApplication.graduations.map((g) => (
                              <div
                                key={g.id}
                                className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40"
                              >
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {g.university} — {g.degree}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {g.specialization}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatDateYearMonth(g.date_from)} —{" "}
                                  {formatDateYearMonth(g.date_to)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ish tajribasi
                          </h4>
                          {selectedUrgentApplication.employments?.length >
                            0 && (
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              Umumiy staj:{" "}
                              {formatExperience(
                                getTotalExperienceMonths(
                                  selectedUrgentApplication.employments
                                )
                              )}
                            </span>
                          )}
                        </div>
                        {selectedUrgentApplication.employments?.length ? (
                          <div className="space-y-3">
                            {selectedUrgentApplication.employments.map((e) => (
                              <div
                                key={e.id}
                                className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40"
                              >
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {e.organization_name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {e.position}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatDateYearMonth(e.date_from)} —{" "}
                                  {formatDateYearMonth(e.date_to)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tillar
                        </h4>
                        {selectedUrgentApplication.languages?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedUrgentApplication.languages.map((l) => (
                              <span
                                key={l.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {l.language_name} —{" "}
                                {translateLanguageDegree(l.degree)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Oylik maosh
                        </h4>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {selectedUrgentApplication.monthly_salary
                            ? new Intl.NumberFormat("uz-UZ").format(
                                selectedUrgentApplication.monthly_salary
                              ) + " so'm"
                            : "Ma'lumot yo'q"}
                        </p>
                      </div>

                      {/* Status Editor */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Holatni o'zgartirish
                        </h4>
                        <div className="flex items-center gap-3">
                          <select
                            value={urgentStatusValue}
                            onChange={(e) =>
                              setUrgentStatusValue(e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                          >
                            <option value="REVIEWING">Kutilmoqda</option>
                            <option value="TEST_SCHEDULED">
                              Qabul qilindi
                            </option>
                            <option value="REJECTED_DOCS">Rad etildi</option>
                          </select>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Joriy:{" "}
                            {getStatusBadge(selectedUrgentApplication.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Vacancy Information */}
                    {selectedUrgentApplication.job && (
                      <div className="space-y-5 border-l border-gray-200 dark:border-gray-700 pl-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                          Vakansiya ma'lumotlari
                        </h3>

                        {/* Title - Large Display */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Vakansiya nomi
                          </h4>
                          <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {selectedUrgentApplication.job.title_uz ||
                              selectedUrgentApplication.job.title ||
                              "Ma'lumot yo'q"}
                          </p>

                          {/* Department and Management Information (for central) or Region (for regional) */}
                          {selectedUrgentApplication.job.branch_type ===
                            "regional" &&
                          selectedUrgentApplication.job.region ? (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div>
                                <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">
                                  Hudud
                                </h5>
                                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                  {(() => {
                                    const region = REGIONS.find(
                                      (r) =>
                                        r.value ===
                                        selectedUrgentApplication.job.region
                                    );
                                    return region
                                      ? region.label
                                      : selectedUrgentApplication.job.region;
                                  })()}
                                </p>
                              </div>
                            </div>
                          ) : (
                            (selectedUrgentApplication.job.management
                              ?.name_uz ||
                              selectedUrgentApplication.job.management
                                ?.department?.name_uz) && (
                              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                {selectedUrgentApplication.job.management
                                  ?.department?.name_uz && (
                                  <div className="mb-2">
                                    <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">
                                      Departament
                                    </h5>
                                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                      {
                                        selectedUrgentApplication.job.management
                                          .department.name_uz
                                      }
                                    </p>
                                  </div>
                                )}
                                {selectedUrgentApplication.job.management
                                  ?.name_uz && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">
                                      Boshqarma
                                    </h5>
                                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                      {
                                        selectedUrgentApplication.job.management
                                          .name_uz
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* Region Title (if regional) */}
                        {selectedUrgentApplication.job.branch_type ===
                          "regional" &&
                          (selectedUrgentApplication.job.region_title_uz ||
                            selectedUrgentApplication.job.region_title_cr ||
                            selectedUrgentApplication.job.region_title_ru) && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  Vakansiyaning to'liq nomi
                                </h4>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      setActiveRegionTitleTab("uz")
                                    }
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                      activeRegionTitleTab === "uz"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                  >
                                    UZ
                                  </button>
                                  <button
                                    onClick={() =>
                                      setActiveRegionTitleTab("cr")
                                    }
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                      activeRegionTitleTab === "cr"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                  >
                                    CR
                                  </button>
                                  <button
                                    onClick={() =>
                                      setActiveRegionTitleTab("ru")
                                    }
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                      activeRegionTitleTab === "ru"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                  >
                                    RU
                                  </button>
                                </div>
                              </div>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {activeRegionTitleTab === "uz" &&
                                  (selectedUrgentApplication.job
                                    .region_title_uz ||
                                    "Ma'lumot yo'q")}
                                {activeRegionTitleTab === "cr" &&
                                  (selectedUrgentApplication.job
                                    .region_title_cr ||
                                    "Ma'lumot yo'q")}
                                {activeRegionTitleTab === "ru" &&
                                  (selectedUrgentApplication.job
                                    .region_title_ru ||
                                    "Ma'lumot yo'q")}
                              </p>
                            </div>
                          )}

                        {/* Language Requirements - Side by Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                              Ingliz tili talabi
                            </h4>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedUrgentApplication.job
                                .lan_requirements_eng === "not_required"
                                ? "Talab qilinmaydi"
                                : selectedUrgentApplication.job
                                    .lan_requirements_eng || "Ma'lumot yo'q"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                              Rus tili talabi
                            </h4>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedUrgentApplication.job
                                .lan_requirements_ru === "not_required"
                                ? "Talab qilinmaydi"
                                : selectedUrgentApplication.job
                                    .lan_requirements_ru || "Ma'lumot yo'q"}
                            </p>
                          </div>
                        </div>

                        {/* Requirements - Only Uzbek */}
                        {selectedUrgentApplication.job.requirements_uz &&
                          Array.isArray(
                            selectedUrgentApplication.job.requirements_uz
                          ) &&
                          selectedUrgentApplication.job.requirements_uz.length >
                            0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Talablar
                              </h4>
                              <ul className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed list-disc list-inside space-y-1">
                                {selectedUrgentApplication.job.requirements_uz.map(
                                  (req, idx) => (
                                    <li key={idx}>{req.task || req}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleUrgentSaveStatus}
                  disabled={savingUrgentStatus}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {savingUrgentStatus ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button
                  onClick={() => closeUrgentModal()}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={urgentDeleteConfirmOpen}
        title="Arizani o'chirish"
        description="Bu arizani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        onConfirm={handleUrgentDeleteConfirm}
        onCancel={handleUrgentDeleteCancel}
      />
    </div>
  );
};

export default Dashboard;
