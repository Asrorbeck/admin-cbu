import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import SendMeetLinkModal from "../components/modals/SendMeetLinkModal";
import EditLanguageInterviewModal from "../components/modals/EditLanguageInterviewModal";
import { getAttemptsApi } from "../utils/api";

const TilSuhbati = () => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize selectedDate from URL params or use today's date
  const getInitialDate = () => {
    const dateParam = searchParams.get("date");
    return dateParam || getTodayDate();
  };
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [showPassedOnly, setShowPassedOnly] = useState(false);
  const [isSendLinkModalOpen, setIsSendLinkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const selectAllCheckboxRef = useRef(null);

  // Check URL params for date on mount and when URL changes
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
    } else if (!dateParam && selectedDate !== getTodayDate()) {
      // If URL param is removed, reset to today's date
      setSelectedDate(getTodayDate());
    }
    document.title = "Til suhbati - Markaziy Bank Administratsiyasi";
  }, [searchParams]);

  useEffect(() => {
    // When date changes, refetch results
    fetchResults();
    setSelectedUserIds([]); // Clear selections when date changes
  }, [selectedDate]);

  // Set indeterminate state for select all checkbox
  // This must be before early returns to follow Rules of Hooks
  useEffect(() => {
    if (selectAllCheckboxRef.current && !loading && !error) {
      // Calculate filtered and paginated data here
      const q = query.trim().toLowerCase();
      const filtered = results.filter((result) => {
        // Date filter (inline to avoid dependency issues)
        if (selectedDate) {
          const resultDate = result.interview_date || result.test_date;
          if (resultDate) {
            try {
              const date = new Date(resultDate);
              const selected = new Date(selectedDate);
              if (
                date.getFullYear() !== selected.getFullYear() ||
                date.getMonth() !== selected.getMonth() ||
                date.getDate() !== selected.getDate()
              ) {
                return false;
              }
            } catch {
              return false;
            }
          } else {
            return false;
          }
        }
        // Passed filter
        if (showPassedOnly && !result.passed) return false;
        // Search filter
        if (q) {
          const inUserName = result.user_name?.toLowerCase().includes(q);
          const inVacancy = result.vacancy_title?.toLowerCase().includes(q);
          if (!inUserName && !inVacancy) return false;
        }
        return true;
      });
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginated = filtered.slice(startIndex, endIndex);
      
      const allSelected = paginated.length > 0 && paginated.every((r) => selectedUserIds.includes(r.id));
      const someSelected = paginated.some((r) => selectedUserIds.includes(r.id));
      
      selectAllCheckboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [selectedUserIds, results, query, showPassedOnly, selectedDate, page, pageSize, loading, error]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedDate) {
        setResults([]);
        setPage(1);
        return;
      }

      // Call API with end_time (test date) and is_passed=true
      const response = await getAttemptsApi({
        end_time: selectedDate,
        is_passed: true,
      });

      // Handle paginated response
      const attempts = Array.isArray(response)
        ? response
        : response?.results || response?.data || [];

      // Map API response to component's expected structure
      const mappedResults = attempts.map((attempt) => {
        // Get vacancy title from application if available, otherwise use test title
        const vacancyTitle = attempt.application?.job?.title || 
                            attempt.application?.vacancy?.title ||
                            attempt.test?.title || 
                            "Ma'lumot yo'q";

        // Get required language levels from vacancy (requirements_ru and requirements_en)
        // These can be "not_required" or actual levels like "A1", "A2", etc.
        const requirementsRu = attempt.application?.vacancy?.requirements_ru;
        const requirementsEn = attempt.application?.vacancy?.requirements_en;
        
        // Convert "not_required" to null, otherwise use the level
        const requiredRussianLevel = requirementsRu && requirementsRu !== "not_required" ? requirementsRu : null;
        const requiredEnglishLevel = requirementsEn && requirementsEn !== "not_required" ? requirementsEn : null;

        // Extract meeting details from API response
        const meetingDetails = attempt.meeting_details || null;
        const meetLinkSent = meetingDetails !== null;

        return {
          id: attempt.id,
          user_name: attempt.chat?.full_name || attempt.chat?.username || "Ma'lumot yo'q",
          phone_number: attempt.chat?.phone_number || "Ma'lumot yo'q",
          vacancy_title: vacancyTitle,
          test_passed: attempt.is_passed || false,
          test_date: attempt.start_time || attempt.end_time || new Date().toISOString(),
          interview_date: selectedDate, // Use selected date as interview date
          meet_link: meetingDetails?.meet_link || null,
          meet_link_sent: meetLinkSent,
          meet_interview_date: meetingDetails?.meet_date || null,
          meet_interview_time: meetingDetails?.meet_time || null,
          meeting_details: meetingDetails, // Store full meeting details
          meeting_attended: attempt.attend !== null ? attempt.attend : null, // From API
          russian_level: attempt.actual_russian_level || null, // From API
          english_level: attempt.actual_english_level || null, // From API
          required_russian_level: requiredRussianLevel,
          required_english_level: requiredEnglishLevel,
          overall_result: attempt.overall_result !== null ? attempt.overall_result : null, // From API
          passed: attempt.overall_result !== null ? attempt.overall_result : null, // Use overall_result as passed
          status: attempt.overall_result !== null 
            ? (attempt.overall_result ? "passed" : "rejected")
            : null,
          created_at: attempt.start_time || attempt.end_time || new Date().toISOString(),
          attempt_data: attempt, // Store original attempt data for reference
        };
      });

      setResults(mappedResults);
      setPage(1);
    } catch (error) {
      console.error("Error fetching language interview results:", error);
      setError(error.message || "Xatolik yuz berdi");
      toast.error("Til suhbati natijalarini yuklashda xatolik yuz berdi");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Compare language levels (A1 < A2 < B1 < B2 < C1 < C2)
  const compareLevel = (level1, level2) => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    if (index1 === -1 || index2 === -1) return 0;
    return index1 - index2;
  };

  // Filter results by selected date
  const filterByDate = (result) => {
    if (!selectedDate) return true;

    const resultDate = result.interview_date || result.test_date;
    if (!resultDate) return false;

    try {
      const date = new Date(resultDate);
      const selected = new Date(selectedDate);

      // Compare only date part (ignore time)
      return (
        date.getFullYear() === selected.getFullYear() &&
        date.getMonth() === selected.getMonth() &&
        date.getDate() === selected.getDate()
      );
    } catch {
      return false;
    }
  };

  const handleSendMeetLink = (user) => {
    // Bitta userga alohida link yuborish (fors major holatlar uchun)
    setSelectedUser(user);
    setIsSendLinkModalOpen(true);
  };

  const handleEditResults = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveResults = (updatedUser) => {
    setResults((prev) =>
      prev.map((r) => (r.id === updatedUser.id ? updatedUser : r))
    );
    setIsEditModalOpen(false);
    setSelectedUser(null);
    toast.success("Til suhbati natijalari muvaffaqiyatli saqlandi");
  };

  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle bulk reject (mark as didn't attend meeting)
  const handleBulkReject = () => {
    if (selectedUserIds.length === 0) {
      toast.error("Hech qanday foydalanuvchi tanlanmagan");
      return;
    }

    setResults((prev) =>
      prev.map((r) =>
        selectedUserIds.includes(r.id)
          ? { ...r, meeting_attended: false }
          : r
      )
    );
    setSelectedUserIds([]);
    toast.success(
      `${selectedUserIds.length} ta foydalanuvchi "Rad etildi (Meetingga qatnashmadi)" deb belgilandi`
    );
  };

  const handleSendLinkSuccess = (meetLinkData) => {
    // Update users with meet link information
    if (meetLinkData && meetLinkData.users && meetLinkData.meet_link) {
      setResults((prev) =>
        prev.map((r) => {
          // Check if this user was in the list of users who received the link
          const userReceivedLink = meetLinkData.users.some(
            (u) => u.id === r.id
          );
          if (userReceivedLink) {
            return {
              ...r,
              meet_link: meetLinkData.meet_link,
              meet_link_sent: true,
              meet_interview_date: meetLinkData.interview_date,
              meet_interview_time: meetLinkData.interview_time,
              meeting_details: {
                meet_link: meetLinkData.meet_link,
                meet_date: meetLinkData.interview_date,
                meet_time: meetLinkData.interview_time,
              },
            };
          }
          return r;
        })
      );
    } else {
      // If no data provided, just refetch
      fetchResults();
    }
    setIsSendLinkModalOpen(false);
    setSelectedUser(null);
    
    // Navigate to /til-suhbati with the selected date as URL parameter (testdan o'tgan sana)
    if (meetLinkData && selectedDate) {
      setSearchParams({ date: selectedDate });
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = showPassedOnly
      ? filtered.filter((r) => r.passed)
      : filtered;

    if (dataToExport.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    // Prepare data for Excel
    const excelData = dataToExport.map((result, index) => ({
      "T/r": index + 1,
      Foydalanuvchi: result.user_name || "Ma'lumot yo'q",
      "Telefon raqami": result.phone_number || "Ma'lumot yo'q",
      Vakansiya: result.vacancy_title || "Ma'lumot yo'q",
      "Rus tili": result.russian_level || "Ma'lumot yo'q",
      "Ingliz tili": result.english_level || "Ma'lumot yo'q",
      "Talab qilinadigan rus tili":
        result.required_russian_level || "Ma'lumot yo'q",
      "Talab qilinadigan ingliz tili":
        result.required_english_level || "Ma'lumot yo'q",
      Holat:
        result.meeting_attended === false
          ? "Rad etildi (Meetingga qatnashmadi)"
          : result.russian_level && result.english_level
          ? result.passed
            ? "O'tdi"
            : "Rad etildi"
          : "Kutilmoqda",
      Sana: formatDate(result.interview_date || result.created_at),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Til suhbati natijalari");

    // Generate filename with date
    const dateStr = selectedDate
      ? new Date(selectedDate).toLocaleDateString("uz-UZ").replace(/\//g, "-")
      : "barcha";
    const filename = `til-suhbati-natijalari-${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    toast.success("Excel fayl muvaffaqiyatli yuklab olindi");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    try {
      const date = new Date(dateString);
      // Check if it's just a date (YYYY-MM-DD) or includes time
      if (dateString.includes('T') || dateString.includes(' ')) {
        return new Intl.DateTimeFormat("uz-UZ", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
      } else {
        // Just date format (YYYY-MM-DD)
        return new Intl.DateTimeFormat("uz-UZ", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      }
    } catch {
      return dateString;
    }
  };

  // Format date for meeting date column (simpler format)
  const formatMeetingDate = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    try {
      // Parse YYYY-MM-DD format
      const [year, month, day] = dateString.split('-');
      const monthNames = [
        "yanvar", "fevral", "mart", "aprel", "may", "iyun",
        "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
      ];
      const monthIndex = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${monthNames[monthIndex]}, ${year}`;
    } catch {
      return dateString;
    }
  };

  // Format date for notification badge (short format)
  const formatDateShort = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNames = [
        "yanvar", "fevral", "mart", "aprel", "may", "iyun",
        "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
      ];
      const month = monthNames[date.getMonth()];
      return `${day} ${month}`;
    } catch {
      return dateString;
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
          onClick={fetchResults}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Filter and paginate results
  const q = query.trim().toLowerCase();
  const filtered = results.filter((result) => {
    // Date filter
    if (!filterByDate(result)) return false;

    // Passed filter
    if (showPassedOnly && !result.passed) return false;

    // Search filter
    if (q) {
      const inUserName = result.user_name?.toLowerCase().includes(q);
      const inVacancy = result.vacancy_title?.toLowerCase().includes(q);
      if (!inUserName && !inVacancy) return false;
    }
    return true;
  });

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginated = filtered.slice(startIndex, endIndex);
  const showingStart = total === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Handle select all (moved here to access paginated)
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUserIds(paginated.map((r) => r.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  // Check if all visible users are selected (moved here to access paginated)
  // Calculate selection states (for use in render)
  const allSelected = paginated.length > 0 && paginated.every((r) => selectedUserIds.includes(r.id));
  const someSelected = paginated.some((r) => selectedUserIds.includes(r.id));

  // Get unique Google Meet interview dates from filtered results
  const meetInterviewDates = [...new Set(
    filtered
      .filter((r) => r.meeting_details && r.meeting_details.meet_date)
      .map((r) => r.meeting_details.meet_date)
  )].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/kadrlar")}
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
              Til suhbati
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Til suhbati natijalarini ko'rish va boshqarish
            </p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Sana:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                setPage(1);
                // Update URL parameter when date changes
                setSearchParams({ date: newDate });
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Google Meet Link Sent Date Badge */}
          {meetInterviewDates.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {meetInterviewDates.map((meetDate) => (
                <div
                  key={meetDate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <span>Google Meet: {formatDateShort(meetDate)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Passed Only Filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="passedOnly"
              checked={showPassedOnly}
              onChange={(e) => {
                setShowPassedOnly(e.target.checked);
                setPage(1);
                setSelectedUserIds([]); // Clear selections when filter changes
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="passedOnly"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Faqat o'tganlar
            </label>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
                setSelectedUserIds([]); // Clear selections when search changes
              }}
              placeholder="Qidirish: foydalanuvchi, vakansiya..."
              className="w-full pr-7 pl-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm placeholder:text-sm text-gray-900 dark:text-white"
            />
            <svg
              className="h-3.5 w-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m1.35-4.65a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Send Meet Link Button */}
          <button
            onClick={() => {
              // Get users from selected date who are in "Kutilmoqda" status
              const usersToSend = results.filter((r) => {
                if (!filterByDate(r)) return false;
                // Faqat "Kutilmoqda" holatidagi userlarga link yuboriladi
                // (passed === null yoki undefined, meeting_attended === null yoki undefined)
                return (
                  (r.passed === null || r.passed === undefined) &&
                  (r.meeting_attended === null ||
                    r.meeting_attended === undefined) &&
                  !r.meeting_details
                );
              });

              if (usersToSend.length === 0) {
                toast.error(
                  "Yuborish uchun 'Kutilmoqda' holatidagi foydalanuvchilar yo'q"
                );
                return;
              }
              setSelectedUser(null); // Barcha "Kutilmoqda" holatidagi userlarga yuborish
              setIsSendLinkModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            Meet link yuborish
          </button>

          {/* Excel Export Button */}
          <button
            onClick={exportToExcel}
            disabled={filtered.length === 0}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Excel yuklab olish
          </button>

          <label className="text-sm text-gray-600 dark:text-gray-400">
            Sahifa hajmi:
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setPageSize(size);
              setPage(1);
            }}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            {[5, 10, 15, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {results.length === 0 ? (
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
            Til suhbati natijalari yo'q
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hozircha til suhbati natijalari mavjud emas.
          </p>
        </div>
      ) : (
        <>
          {/* Bulk Action Button */}
          {selectedUserIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {selectedUserIds.length} ta foydalanuvchi tanlangan
                </span>
              </div>
              <button
                onClick={handleBulkReject}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Rad etildi (Meetingga qatnashmadi)
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        ref={selectAllCheckboxRef}
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      T/r
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Foydalanuvchi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vakansiya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rus tili
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ingliz tili
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Holat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Meet link holati
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Meeting vaqti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginated.map((result, index) => (
                    <tr
                      key={result.id}
                      onClick={() => handleEditResults(result)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(result.id)}
                          onChange={() => handleUserSelect(result.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {result.user_name || "Ma'lumot yo'q"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.phone_number || "Ma'lumot yo'q"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.vacancy_title || "Ma'lumot yo'q"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.russian_level || (
                          <span className="text-gray-400 italic">
                            Tanlanmagan
                          </span>
                        )}
                        {result.required_russian_level && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            (Talab: {result.required_russian_level})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.english_level || (
                          <span className="text-gray-400 italic">
                            Tanlanmagan
                          </span>
                        )}
                        {result.required_english_level && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            (Talab: {result.required_english_level})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.meeting_attended === false ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Rad etildi (Meetingga qatnashmadi)
                          </span>
                        ) : result.russian_level && result.english_level ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              result.passed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {result.passed ? "O'tdi" : "Rad etildi"}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            Kutilmoqda
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.meeting_details ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Yuborilgan
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            Yuborilmagan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.meeting_details ? (
                          <div>
                            <div className="font-medium">
                              {result.meet_interview_date ? formatMeetingDate(result.meet_interview_date) : "Ma'lumot yo'q"}
                            </div>
                            {result.meet_interview_time && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {result.meet_interview_time.length > 5 
                                  ? result.meet_interview_time.substring(0, 5) 
                                  : result.meet_interview_time}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Ma'lumot yo'q</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Har doim meet link iconi turaversin (fors major holatlar uchun) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Row click eventini to'xtatish
                              handleSendMeetLink(result);
                            }}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Meet link yuborish (alohida)"
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
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
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

          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {`Ko'rsatilmoqda ${showingStart}-${showingEnd} / ${total}`}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Oldingi
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {`Sahifa ${page} / ${totalPages}`}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Keyingi
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {isSendLinkModalOpen && (
        <SendMeetLinkModal
          isOpen={isSendLinkModalOpen}
          onClose={() => {
            setIsSendLinkModalOpen(false);
            setSelectedUser(null);
          }}
          users={
            selectedUser
              ? [selectedUser] // Bitta userga alohida yuborish (row icon bosilganda)
              : results.filter((r) => {
                  // Table tepasidagi button bosilganda - faqat "Kutilmoqda" holatidagi userlarga
                  if (!filterByDate(r)) return false;
                  return (
                    (r.passed === null || r.passed === undefined) &&
                    (r.meeting_attended === null ||
                      r.meeting_attended === undefined) &&
                    !r.meeting_details
                  );
                })
          }
          selectedDate={selectedDate}
          onSuccess={handleSendLinkSuccess}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <EditLanguageInterviewModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleSaveResults}
        />
      )}
    </div>
  );
};

export default TilSuhbati;
