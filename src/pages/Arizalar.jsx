import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getApplicationsApi,
  getApplicationByIdApi,
  updateApplicationApi,
  deleteApplicationApi,
  getDeadlineArchivesApi,
  getVacancySelectionHierarchyApi,
} from "../utils/api";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/modals/ConfirmDialog";

const EvalRulesModalContent = ({
  applications,
  evaluationRules,
  onClose,
  onSaveRules,
}) => {
  const uniqueJobsMap = new Map();
  applications.forEach((a) => {
    if (a.job && a.job.id && !uniqueJobsMap.has(a.job.id)) {
      uniqueJobsMap.set(a.job.id, a.job);
    }
  });
  const uniqueJobs = Array.from(uniqueJobsMap.values());

  const [selectedJobId, setSelectedJobId] = useState(uniqueJobs[0]?.id || "");
  const currentRule = (selectedJobId && evaluationRules[selectedJobId]) || {};
  const [minAge, setMinAge] = useState(currentRule.minAge || "");
  const [maxAge, setMaxAge] = useState(currentRule.maxAge || "");
  const [minExpYears, setMinExpYears] = useState(currentRule.minExpYears || "");

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    const rule = (jobId && evaluationRules[jobId]) || {};
    setMinAge(rule.minAge || "");
    setMaxAge(rule.maxAge || "");
    setMinExpYears(rule.minExpYears || "");
  };

  const handleSave = () => {
    if (!selectedJobId) return;
    const next = { ...evaluationRules };
    next[selectedJobId] = {
      minAge: minAge ? Number(minAge) : null,
      maxAge: maxAge ? Number(maxAge) : null,
      minExpYears: minExpYears ? Number(minExpYears) : null,
    };
    onSaveRules(next);
    onClose();
  };

  const handleClear = () => {
    if (!selectedJobId) return;
    const next = { ...evaluationRules };
    delete next[selectedJobId];
    onSaveRules(next);
    onClose();
  };

  return (
    <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            O'lchash rejimi
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Vakansiya
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            {uniqueJobs.length === 0 && (
              <option value="">Vakansiyalar topilmadi</option>
            )}
            {uniqueJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Minimal yosh
            </label>
            <input
              type="number"
              min="0"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              placeholder="masalan 25"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Maksimal yosh
            </label>
            <input
              type="number"
              min="0"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              placeholder="ixtiyoriy"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
            Minimal tajriba (yil)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={minExpYears}
            onChange={(e) => setMinExpYears(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            placeholder="masalan 2"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ushbu parametrlar faqat tanlangan vakansiyaga tegishli arizalar uchun
          qo'llaniladi. Jadvalda "Mos" / "Mos emas" badge'lari yangilanadi.
        </p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-between gap-3">
        <button
          type="button"
          onClick={handleClear}
          disabled={!selectedJobId}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
        >
          Ushbu vakansiya uchun qoidani o'chirish
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedJobId}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Saqlash
        </button>
      </div>
    </div>
  );
};

const Arizalar = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusValue, setStatusValue] = useState("NEW");
  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("NEW");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [evaluationRules, setEvaluationRules] = useState({});
  const [evaluationFilter, setEvaluationFilter] = useState("all");
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [jshshirQuery, setJshshirQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [hierarchyFilters, setHierarchyFilters] = useState({
    type: null, // 'central' or 'regional'
    department_id: null,
    management_id: null,
    job_id: null,
    region: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeadlineArchives();
    fetchHierarchy();
    document.title = "Arizalar - Markaziy Bank Administratsiyasi";
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedDate, searchQuery, jshshirQuery, hierarchyFilters]);

  useEffect(() => {
    fetchApplications();
  }, [selectedDate, page, pageSize, searchQuery, jshshirQuery, hierarchyFilters]);

  // Load / persist evaluation rules in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("appsEvaluationRules");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setEvaluationRules(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load evaluation rules from storage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "appsEvaluationRules",
        JSON.stringify(evaluationRules)
      );
    } catch (e) {
      console.error("Failed to save evaluation rules to storage", e);
    }
  }, [evaluationRules]);

  const fetchHierarchy = async () => {
    try {
      setLoadingHierarchy(true);
      const data = await getVacancySelectionHierarchyApi();
      setHierarchyData(data);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      toast.error("Vakansiya ma'lumotlarini yuklashda xatolik yuz berdi");
      setHierarchyData(null);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const fetchDeadlineArchives = async () => {
    try {
      setLoadingDates(true);
      const archivesData = await getDeadlineArchivesApi();
      // Handle paginated response structure: { count, next, previous, results: [...] }
      // or direct array response
      const archivesArray = Array.isArray(archivesData) 
        ? archivesData 
        : (archivesData?.results || archivesData?.data || []);
      
      // Extract unique dates from the archives
      const dates = [...new Set(archivesArray.map(archive => archive.application_deadline))];
      // Sort dates in descending order (newest first)
      dates.sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error fetching deadline archives:", error);
      toast.error("Muddatiy sanalarni yuklashda xatolik yuz berdi");
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page,
        page_size: pageSize,
      };
      
      if (selectedDate) {
        params.application_deadline = selectedDate;
      }
      
      if (searchQuery.trim()) {
        params.full_name = searchQuery.trim();
      }
      
      if (jshshirQuery.trim()) {
        params.jshshir = jshshirQuery.trim();
      }
      
      // Add hierarchy filter params
      if (hierarchyFilters.department_id) {
        params.department_id = hierarchyFilters.department_id;
      }
      if (hierarchyFilters.management_id) {
        params.management_id = hierarchyFilters.management_id;
      }
      if (hierarchyFilters.job_id) {
        params.job_id = hierarchyFilters.job_id;
      }

      const applicationsData = await getApplicationsApi(params);
      // Handle paginated response structure: { count, next, previous, results: [...] }
      // or direct array response
      const applicationsArray = Array.isArray(applicationsData) 
        ? applicationsData 
        : (applicationsData?.results || applicationsData?.data || []);
      setApplications(applicationsArray);
      
      // Save pagination info
      if (applicationsData && !Array.isArray(applicationsData)) {
        setPaginationInfo({
          count: applicationsData.count || 0,
          next: applicationsData.next,
          previous: applicationsData.previous,
        });
      } else {
        setPaginationInfo({
          count: applicationsArray.length,
          next: null,
          previous: null,
        });
      }
      
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(error.message);
      toast.error("Arizalarni yuklashda xatolik yuz berdi");
      // Set empty array on error to prevent forEach errors
      setApplications([]);
      setPaginationInfo({
        count: 0,
        next: null,
        previous: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    return new Date(dateString).toLocaleDateString("uz-UZ");
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
      "yanvar", "fevral", "mart", "aprel", "may", "iyun",
      "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
    ];
    const month = monthNames[date.getMonth()];
    return `${year}-yil, ${month}`;
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

  // Helpers for experience calculation
  const parseDateSafe = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
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

  const evaluateApplication = (application) => {
    const jobId = application.job?.id || application.job;
    if (!jobId || !evaluationRules[jobId]) return { status: null };
    const rule = evaluationRules[jobId];
    const age = calculateAge(application.data_of_birth);
    const expMonths = getTotalExperienceMonths(application.employments);
    const expYears = expMonths / 12;
    let ok = true;
    const reasons = [];

    if (rule.minAge && (age == null || age < rule.minAge)) {
      ok = false;
      reasons.push(`Yosh minimal ${rule.minAge} dan kam`);
    }
    if (rule.maxAge && age != null && age > rule.maxAge) {
      ok = false;
      reasons.push(`Yosh maksimal ${rule.maxAge} dan katta`);
    }
    if (rule.minExpYears && expYears < rule.minExpYears) {
      ok = false;
      reasons.push(`Tajriba minimal ${rule.minExpYears} yildan kam`);
    }

    return {
      status: ok ? "good" : "bad",
      age,
      expYears,
      reasons,
    };
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

  const isExpired = (application) => {
    const deadline = application?.job?.application_deadline;
    const testAt = application?.job?.test_scheduled_at;
    const now = new Date();
    const d1 = parseDateSafe(deadline);
    const d2 = parseDateSafe(testAt);
    return (d1 && now > d1) || (d2 && now > d2);
  };

  // Fuzzy duplicate detection (>=70% similar name AND same date_of_birth)
  const normalizeName = (name) =>
    (name || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const nameTokens = (name) => normalizeName(name).split(" ").filter(Boolean);

  const diceCoefficient = (a, b) => {
    const bigrams = (s) => {
      const n = s.length;
      if (n < 2) return new Map([[s, 1]]);
      const m = new Map();
      for (let i = 0; i < n - 1; i++) {
        const bg = s.slice(i, i + 2);
        m.set(bg, (m.get(bg) || 0) + 1);
      }
      return m;
    };
    const A = bigrams(normalizeName(a));
    const B = bigrams(normalizeName(b));
    let overlap = 0;
    A.forEach((count, bg) => {
      if (B.has(bg)) overlap += Math.min(count, B.get(bg));
    });
    const total =
      [...A.values()].reduce((s, v) => s + v, 0) +
      [...B.values()].reduce((s, v) => s + v, 0);
    return total === 0 ? 0 : (2 * overlap) / total;
  };

  const jaccardTokens = (a, b) => {
    const A = new Set(nameTokens(a));
    const B = new Set(nameTokens(b));
    if (A.size === 0 && B.size === 0) return 0;
    let inter = 0;
    A.forEach((t) => {
      if (B.has(t)) inter++;
    });
    const uni = A.size + B.size - inter;
    return uni === 0 ? 0 : inter / uni;
  };

  const nameSimilarity = (a, b) => {
    const sim1 = Math.max(diceCoefficient(a, b), jaccardTokens(a, b));
    const rev = (s) => nameTokens(s).reverse().join(" ");
    const sim2 = Math.max(diceCoefficient(a, rev(b)), jaccardTokens(a, rev(b)));
    return Math.max(sim1, sim2);
  };

  const duplicateGroups = (() => {
    // Ensure applications is an array before using forEach
    const safeApplications = Array.isArray(applications) ? applications : [];
    const byDob = new Map();
    safeApplications.forEach((a) => {
      const dob = a.data_of_birth || "";
      if (!byDob.has(dob)) byDob.set(dob, []);
      byDob.get(dob).push(a);
    });
    const groups = [];
    byDob.forEach((list) => {
      const local = [];
      list.forEach((item) => {
        let placed = false;
        for (const g of local) {
          if (
            g.some((m) => nameSimilarity(m.user?.full_name || m.full_name || "", item.user?.full_name || item.full_name || "") >= 0.7)
          ) {
            g.push(item);
            placed = true;
            break;
          }
        }
        if (!placed) local.push([item]);
      });
      local.filter((g) => g.length > 1).forEach((g) => groups.push(g));
    });
    return groups;
  })();

  const duplicateIds = new Set(duplicateGroups.flat().map((a) => a.id));
  const isDuplicate = (a) => duplicateIds.has(a.id);

  // Notify header and support opening duplicates modal
  useEffect(() => {
    const count = duplicateGroups.length;
    window.dispatchEvent(
      new CustomEvent("apps-duplicates", { detail: { has: count > 0, count } })
    );

    const openHandler = () => setDuplicatesOpen(true);
    window.addEventListener("open-duplicates-modal", openHandler);
    return () =>
      window.removeEventListener("open-duplicates-modal", openHandler);
  }, [duplicateGroups]);

  const [duplicatesOpen, setDuplicatesOpen] = useState(false);

  const handleViewDetails = async (applicationId) => {
    try {
      setIsModalOpen(true);
      setModalLoading(true);
      const fullData = await getApplicationByIdApi(applicationId);
      setSelectedApplication(fullData);
      // Handle status mapping: backend returns "NEW" but we need to normalize it
      const normalizedStatus = (fullData?.status || "NEW").toUpperCase();
      setStatusValue(normalizedStatus === "PENDING" ? "REVIEWING" : normalizedStatus);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Ariza ma'lumotlarini yuklashda xatolik yuz berdi");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
  };

  const handleSaveStatus = async () => {
    if (!selectedApplication) return;
    try {
      setSavingStatus(true);
      const fullPayload = {
        user_id: selectedApplication.user?.user_id || selectedApplication.user_id,
        job: selectedApplication.job?.id || selectedApplication.job,
        full_name: selectedApplication.user?.full_name || selectedApplication.full_name,
        data_of_birth: selectedApplication.data_of_birth,
        phone: selectedApplication.user?.phone_number || selectedApplication.phone,
        additional_information: selectedApplication.additional_information,
        jshshir: selectedApplication.jshshir,
        monthly_salary: selectedApplication.monthly_salary,
        graduations: selectedApplication.graduations || [],
        employments: selectedApplication.employments || [],
        languages: selectedApplication.languages || [],
        status: statusValue,
      };

      await toast.promise(
        updateApplicationApi(selectedApplication.id, fullPayload),
        {
          loading: "Saqlanmoqda...",
          success: "Holat muvaffaqiyatli yangilandi",
          error: (err) =>
            err?.message || "Holatni yangilashda xatolik yuz berdi",
        }
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApplication.id ? { ...a, status: statusValue } : a
        )
      );
      setSelectedApplication((prev) => ({ ...prev, status: statusValue }));
      
      // Close modal after successful save
      closeModal();
    } finally {
      setSavingStatus(false);
    }
  };

  // Bulk status update
  const handleToggleAll = (checked, visibleIds) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleToggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkUpdating(true);
      const safeApplications = Array.isArray(applications) ? applications : [];
      const selectedApps = safeApplications.filter((a) => selectedIds.has(a.id));
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
              status: bulkStatus,
            })
          )
        ),
        {
          loading: "Bir nechta arizalar yangilanmoqda...",
          success: "Holatlar muvaffaqiyatli yangilandi",
          error: "Bulk yangilashda xatolik yuz berdi",
        }
      );
      setApplications((prev) =>
        prev.map((a) =>
          selectedIds.has(a.id) ? { ...a, status: bulkStatus } : a
        )
      );
      setSelectedIds(new Set());
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Delete application
  const handleDeleteClick = (applicationId, e) => {
    e.stopPropagation();
    setDeletingApplicationId(applicationId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingApplicationId) return;
    try {
      setIsDeleting(true);
      await toast.promise(
        deleteApplicationApi(deletingApplicationId),
        {
          loading: "O'chirilmoqda...",
          success: "Ariza muvaffaqiyatli o'chirildi",
          error: (err) =>
            err?.message || "Arizani o'chirishda xatolik yuz berdi",
        }
      );
      setApplications((prev) =>
        prev.filter((a) => a.id !== deletingApplicationId)
      );
      setDeleteConfirmOpen(false);
      setDeletingApplicationId(null);
    } catch (error) {
      console.error("Error deleting application:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeletingApplicationId(null);
  };

  // Frontend filtering (evaluation filter only - search and jshshir handled by backend)
  const safeApplications = Array.isArray(applications) ? applications : [];
  const filteredApps = safeApplications.filter((a) => {
    // If evaluation rules are set (o'lchash rejimi qo'yilgan), filter by selected vacancy
    const hasEvaluationRules = Object.keys(evaluationRules).length > 0;
    if (hasEvaluationRules && a.job && a.job.id) {
      // Only show applications for vacancies that have evaluation rules
      if (!evaluationRules[a.job.id]) {
        return false;
      }
    }
    
    const evalResult = evaluateApplication(a);
    if (evaluationFilter === "good") return evalResult.status === "good";
    if (evaluationFilter === "bad") return evalResult.status === "bad";
    return true;
  });
  
  // Backend pagination info
  const totalItems = paginationInfo.count;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = page;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  
  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const visibleApps = filteredApps; // All filtered apps from current page
  const allVisibleSelected =
    visibleApps.length > 0 && visibleApps.every((a) => selectedIds.has(a.id));
  const someVisibleSelected =
    visibleApps.some((a) => selectedIds.has(a.id)) && !allVisibleSelected;

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
          onClick={fetchApplications}
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
        <div className="flex items-center space-x-4">
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ishga arizalar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Nomzodlardan kelgan arizalar ro'yxati
            </p>
          </div>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-3">
          {/* Duplicates alert (page-level) */}
      {duplicateGroups.length > 0 && (
        <div className="flex items-center justify-end ">
          <button
            type="button"
            onClick={() => setDuplicatesOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs sm:text-sm font-medium rounded-md hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
            title="Bir xillik aniqlanmoqda"
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
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            Bir xillik aniqlanmoqda
            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-amber-500 text-white text-[10px]">
              {duplicateGroups.length}
            </span>
          </button>
        </div>
      )}
          <button
            type="button"
            onClick={() => setIsEvalModalOpen(true)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-blue-200 dark:border-blue-700 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            O'lchash rejimi
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Moslik:
            </label>
            <select
              value={evaluationFilter}
              onChange={(e) => {
                setEvaluationFilter(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white"
            >
              <option value="all">Barchasi</option>
              <option value="good">Faqat mos</option>
              <option value="bad">Faqat mos emas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left side: Date and Search inputs */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Ariza muddati:
              </label>
              {loadingDates ? (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  Yuklanmoqda...
                </div>
              ) : (
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Barcha sanalar</option>
                  {availableDates.map((date) => {
                    const dateObj = new Date(date + "T00:00:00");
                    const day = dateObj.getDate();
                    const monthNames = [
                      "yanvar", "fevral", "mart", "aprel", "may", "iyun",
                      "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
                    ];
                    const month = monthNames[dateObj.getMonth()];
                    const year = dateObj.getFullYear();
                    const formattedDate = `${day} ${month}, ${year}`;
                    return (
                      <option key={date} value={date}>
                        {formattedDate}
                      </option>
                    );
                  })}
                </select>
              )}
              {selectedDate && !loadingDates && (
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setPage(1);
                  }}
                  className="px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Tozalash"
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
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Ism bo'yicha qidirish..."
                className="w-48 px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
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
                value={jshshirQuery}
                onChange={(e) => {
                  setJshshirQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="JSHSHIR bo'yicha qidirish..."
                className="w-48 px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {jshshirQuery ? (
                <button
                  onClick={() => {
                    setJshshirQuery("");
                    setPage(1);
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
            
            {/* Hierarchy Filter - Inline with search bars */}
            {/* First Select: Type Selection */}
            <div className="relative min-w-[180px]">
              <select
                value={hierarchyFilters.type || ""}
                onChange={(e) => {
                  const newType = e.target.value || null;
                  if (newType) {
                    setHierarchyFilters({ 
                      type: newType, 
                      department_id: null, 
                      management_id: null, 
                      job_id: null, 
                      region: null 
                    });
                  } else {
                    setHierarchyFilters({ 
                      type: null, 
                      department_id: null, 
                      management_id: null, 
                      job_id: null, 
                      region: null 
                    });
                  }
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tashkilot turi</option>
                <option value="central">Markaziy apparat</option>
                <option value="regional">Hududiy bosh boshqarma</option>
              </select>
            </div>

            {/* Second Select: Department/Region Selection */}
            {hierarchyFilters.type === 'central' && hierarchyData?.central && (
              <div className="relative min-w-[180px]">
                <select
                  value={hierarchyFilters.department_id || ""}
                  onChange={(e) => {
                    const deptId = e.target.value ? parseInt(e.target.value) : null;
                    setHierarchyFilters({ 
                      ...hierarchyFilters, 
                      department_id: deptId, 
                      management_id: null, 
                      job_id: null 
                    });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Departament</option>
                  {hierarchyData.central.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hierarchyFilters.type === 'regional' && hierarchyData?.regional && (
              <div className="relative min-w-[180px]">
                <select
                  value={hierarchyFilters.region || ""}
                  onChange={(e) => {
                    const region = e.target.value || null;
                    setHierarchyFilters({ 
                      ...hierarchyFilters, 
                      region, 
                      job_id: null 
                    });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Viloyat</option>
                  {hierarchyData.regional.map((reg) => (
                    <option key={reg.region} value={reg.region}>
                      {reg.region}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Third Select: Management Selection (only for central with managements) */}
            {hierarchyFilters.type === 'central' && 
             hierarchyFilters.department_id && 
             hierarchyData?.central && (() => {
              const dept = hierarchyData.central.find(d => d.department_id === hierarchyFilters.department_id);
              const hasManagements = dept?.managements && dept.managements.length > 0;
              
              if (hasManagements) {
                return (
                  <div key="management-select" className="relative min-w-[180px]">
                    <select
                      value={hierarchyFilters.management_id || ""}
                      onChange={(e) => {
                        const mgmtId = e.target.value ? parseInt(e.target.value) : null;
                        setHierarchyFilters({ 
                          ...hierarchyFilters, 
                          management_id: mgmtId, 
                          job_id: null 
                        });
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Boshqarma</option>
                      {dept.managements.map((mgmt) => (
                        <option key={mgmt.management_id} value={mgmt.management_id}>
                          {mgmt.management_name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}

            {/* Fourth Select: Vacancy Selection (only for central, not for regional) */}
            {hierarchyFilters.type === 'central' && hierarchyFilters.department_id && (() => {
              const dept = hierarchyData?.central?.find(d => d.department_id === hierarchyFilters.department_id);
              const hasManagements = dept?.managements && dept.managements.length > 0;
              
              // Show vacancy select if:
              // 1. Department has managements AND management is selected
              // 2. Department has no managements (direct vacancies)
              const shouldShow = hasManagements 
                ? hierarchyFilters.management_id 
                : true;
              
              if (shouldShow) {
                const vacancies = hasManagements 
                  ? dept.managements.find(m => m.management_id === hierarchyFilters.management_id)?.vacancies || []
                  : dept?.vacancies || [];
                
                if (vacancies.length > 0) {
                  return (
                    <div key="vacancy-select-central" className="relative min-w-[180px]">
                      <select
                        value={hierarchyFilters.job_id || ""}
                        onChange={(e) => {
                          const jobId = e.target.value ? parseInt(e.target.value) : null;
                          setHierarchyFilters({ 
                            ...hierarchyFilters, 
                            job_id: jobId 
                          });
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Vakansiya</option>
                        {vacancies.map((vacancy) => (
                          <option key={vacancy.id} value={vacancy.id}>
                            {vacancy.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
              }
              
              return null;
            })()}

            {/* Clear button for hierarchy filter */}
            {(hierarchyFilters.type || hierarchyFilters.department_id || hierarchyFilters.management_id || hierarchyFilters.job_id || hierarchyFilters.region) && (
              <button
                onClick={() => {
                  setHierarchyFilters({ type: null, department_id: null, management_id: null, job_id: null, region: null });
                  setPage(1);
                }}
                className="px-2.5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Filterni tozalash"
              >
                ✕
              </button>
            )}

            {/* Loading state */}
            {loadingHierarchy && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          
          {/* Right side: Page Size */}
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Sahifa hajmi:
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
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
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md px-4 py-3">
          <div className="text-sm text-amber-800 dark:text-amber-200">
            Tanlangan: {selectedIds.size} ta ariza
          </div>
          <div className="flex items-center gap-3">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              <option value="NEW">Yangi</option>
              <option value="REVIEWING">Kutilmoqda</option>
              <option value="TEST_SCHEDULED">Qabul qilindi</option>
              <option value="REJECTED_DOCS">Rad etildi</option>
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={isBulkUpdating}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isBulkUpdating ? "Yangilanmoqda..." : "Holatni qo'llash"}
            </button>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected;
                    }}
                    onChange={(e) =>
                      handleToggleAll(
                        e.target.checked,
                        visibleApps.map((a) => a.id)
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
                  Moslik
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
              {visibleApps.map((application, index) => (
                <tr
                  key={application.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewDetails(application.id)}
                >
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle checkbox if click is not directly on the checkbox
                      if (e.target.type !== 'checkbox') {
                        const isSelected = selectedIds.has(application.id);
                        handleToggleOne(application.id, !isSelected);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(application.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleToggleOne(application.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {startIndex + index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {application.user?.full_name || application.full_name || "Ma'lumot yo'q"}
                      </div>
                      {isDuplicate(application) && (
                        <span
                          title="Takror kirim: to'liq ism va tug'ilgan sana bir xil"
                          className="inline-flex items-center"
                        >
                          <svg
                            className="h-4 w-4 text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                          </svg>
                        </span>
                      )}
                      {isExpired(application) && (
                        <span
                          title="Test muddati yoki ariza muddati o'tgan"
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        >
                          Muddati o'tgan
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 w-40 max-w-[180px]">
                    <span
                      className="block overflow-hidden text-ellipsis"
                      title={application.job?.title || ""}
                    >
                      {truncateText(application.job?.title || "—", 40)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {(() => {
                      const age = calculateAge(application.data_of_birth);
                      return age === null ? "Ma'lumot yo'q" : `${age} yosh`;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {application.user?.phone_number || application.phone || "Ma'lumot yo'q"}
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
                        <span className="text-gray-500">Ma'lumot yo'q</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatExperience(
                      getTotalExperienceMonths(application.employments)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      const evalResult = evaluateApplication(application);
                      if (evalResult.status === "good") {
                        return (
                          <span
                            title="Talablarga mos"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Mos
                          </span>
                        );
                      }
                      if (evalResult.status === "bad") {
                        return (
                          <span
                            title={
                              evalResult.reasons?.join("; ") ||
                              "Talablarga to'liq mos emas"
                            }
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          >
                            Mos emas
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
                          Qoidalar yo'q
                        </span>
                      );
                    })()}
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
                        onClick={() => handleViewDetails(application.id)}
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
                        onClick={(e) => handleDeleteClick(application.id, e)}
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
        {/* Pagination footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {totalItems === 0
              ? "0 yozuv"
              : `${startIndex}–${endIndex} / ${totalItems} yozuv`}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={!paginationInfo.previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Oldingi
            </button>
            
            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-sm text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  );
                }
                
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={!paginationInfo.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>

      {/* Evaluation rules modal */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setIsEvalModalOpen(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <EvalRulesModalContent
              applications={applications}
              evaluationRules={evaluationRules}
              onClose={() => setIsEvalModalOpen(false)}
              onSaveRules={setEvaluationRules}
            />
          </div>
        </div>
      )}

      {/* Duplicates Modal */}
      {duplicatesOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setDuplicatesOpen(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Takror arizalar
                  </h3>
                  <button
                    onClick={() => setDuplicatesOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                {duplicateGroups.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Takror arizalar topilmadi.
                  </p>
                ) : (
                  duplicateGroups.map((items, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-md p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {items[0]?.user?.full_name || items[0]?.full_name || "Ma'lumot yo'q"} — {items[0]?.data_of_birth}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {items.length} ta ariza
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {items.slice(0, 2).map((a) => (
                          <div
                            key={a.id}
                            className="bg-gray-50 dark:bg-gray-700/40 rounded p-3 text-sm text-gray-800 dark:text-gray-200"
                          >
                            <div className="font-semibold">{a.user?.full_name || a.full_name || "Ma'lumot yo'q"}</div>
                            <div className="text-xs text-gray-500">
                              {a.data_of_birth}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                              {a.user?.phone_number || a.phone || "Ma'lumot yo'q"}
                            </div>
                            <div className="mt-2">
                              <button
                                onClick={() => handleViewDetails(a.id)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Tafsilot
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setDuplicatesOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Empty State */}
      {applications.length === 0 && (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Arizalar yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha hech kim ishga ariza bermagan.
          </p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => closeModal()}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ariza tafsilotlari
                  </h3>
                  <button
                    onClick={() => closeModal()}
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
                {modalLoading ? (
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
                ) : selectedApplication ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          To'liq ism
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedApplication.user?.full_name || selectedApplication.full_name || "Ma'lumot yo'q"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Yosh
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {(() => {
                            const age = calculateAge(
                              selectedApplication.data_of_birth
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
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedApplication.user?.phone_number || selectedApplication.phone || "Ma'lumot yo'q"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          Qo'shimcha ma'lumot
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedApplication.additional_information ||
                            "Ma'lumot yo'q"}
                        </p>
                      </div>
                    </div>

                    {/* Job Information */}
                    {selectedApplication.job && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ish o'rni
                        </h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedApplication.job.title || "Ma'lumot yo'q"}
                          {selectedApplication.job.management_details?.name && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {" "}
                              ({selectedApplication.job.management_details.name}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ta'lim
                      </h4>
                      {selectedApplication.graduations?.length ? (
                        <div className="space-y-3">
                          {selectedApplication.graduations.map((g) => (
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
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ish tajribasi
                      </h4>
                      {selectedApplication.employments?.length ? (
                        <div className="space-y-3">
                          {selectedApplication.employments.map((e) => (
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
                      {selectedApplication.languages?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.languages.map((l) => (
                            <span
                              key={l.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {l.language_name} — {translateLanguageDegree(l.degree)}
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
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedApplication.monthly_salary 
                          ? new Intl.NumberFormat('uz-UZ').format(selectedApplication.monthly_salary) + " so'm"
                          : "Ma'lumot yo'q"}
                      </p>
                    </div>

                    {/* Status Editor (placed after languages) */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Holatni o'zgartirish
                      </h4>
                      <div className="flex items-center gap-3">
                      <select
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="NEW">Yangi</option>
                        <option value="REVIEWING">Kutilmoqda</option>
                        <option value="TEST_SCHEDULED">Qabul qilindi</option>
                        <option value="REJECTED_DOCS">Rad etildi</option>
                      </select>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Joriy: {getStatusBadge(selectedApplication.status)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {savingStatus ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button
                  onClick={() => closeModal()}
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
        open={deleteConfirmOpen}
        title="Arizani o'chirish"
        description="Bu arizani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default Arizalar;
