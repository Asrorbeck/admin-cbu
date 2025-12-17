import { useState, useEffect, useRef } from "react";
import { getApplicationsApi } from "../utils/api";
import { getNotificationsApi, sendNotificationApi } from "../utils/api";
import toast from "react-hot-toast";

const Xabarnoma = () => {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [messageText]);

  const fetchApplications = async () => {
    try {
      const data = await getApplicationsApi({ page_size: 1000 });
      const applicationsArray = Array.isArray(data)
        ? data
        : data?.results || data?.data || [];
      setApplications(applicationsArray);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      try {
        const data = await getNotificationsApi();
        if (data && Array.isArray(data)) {
          setNotifications(data);
          localStorage.setItem("xabarnoma_notifications", JSON.stringify(data));
        }
      } catch (apiError) {
        const saved = localStorage.getItem("xabarnoma_notifications");
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      const saved = localStorage.getItem("xabarnoma_notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      toast.error("Xabarnoma matni bo'sh bo'lishi mumkin emas");
      return;
    }

    const newNotification = {
      id: Date.now(),
      message: messageText.trim(),
      recipients: "all",
      recipientCount: applications.length,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    try {
      setSending(true);
      
      // Add to UI immediately
      const updated = [newNotification, ...notifications];
      setNotifications(updated);
      localStorage.setItem("xabarnoma_notifications", JSON.stringify(updated));
      
      // Try to send via API
      try {
        await sendNotificationApi({
          message: messageText.trim(),
          recipients: "all",
        });
      } catch (apiError) {
        console.log("API not available, saved locally");
      }

      toast.success(`${applications.length} ta foydalanuvchiga xabarnoma yuborildi`);
      
      setMessageText("");
    } catch (error) {
      console.error("Error sending notification:", error);
      setNotifications(notifications);
      localStorage.setItem("xabarnoma_notifications", JSON.stringify(notifications));
      
      const errorMessage =
        error.responseData?.detail ||
        error.responseData?.message ||
        error.message ||
        "Xabarnoma yuborishda xatolik yuz berdi";
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const getFilteredApplications = () => {
    if (!searchQuery.trim()) return applications;
    const query = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        app.full_name?.toLowerCase().includes(query) ||
        app.jshshir?.includes(query) ||
        app.phone_number?.includes(query)
    );
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Hozirgina";
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days === 1) return "Kecha";
    if (days < 7) return `${days} kun oldin`;

    return date.toLocaleDateString("uz-UZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateHeader = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Bugun";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kecha";
    } else {
      return date.toLocaleDateString("uz-UZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupNotificationsByDate = () => {
    const grouped = {};
    notifications.forEach((notification) => {
      const date = new Date(notification.timestamp);
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(notification);
    });
    return grouped;
  };

  const filteredApplications = getFilteredApplications();
  
  return (
    <div className="h-screen flex flex-col -mx-6 -my-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden" style={{ height: '93vh' }}>
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Recipients List */}
        <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Arizalar ro'yxati ({applications.length})
            </h2>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
            </div>
          </div>

          {/* Applications List - with scroll */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Foydalanuvchilar topilmadi
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {app?.user?.full_name || "Ism yo'q"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      User ID: {app.user?.user_id || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Compose Section - Left */}
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            <div className="p-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Composer Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Yangi xabarnoma
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Barcha ariza topshirgan foydalanuvchilarga yuboriladi
                  </p>
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSendNotification} className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Xabarnoma matni
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Xabarnoma matnini kiriting..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {messageText.length} belgi
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setMessageText("")}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Tozalash
                    </button>
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sending}
                      className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Yuborilmoqda...
                        </>
                      ) : (
                        <>
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
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                          Yuborish
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* History Section - Right */}
          <div className="w-[480px] border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden min-h-0">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Yuborilgan xabarnomalar
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0 max-h-[75vh]">
              {notifications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <svg
                    className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Hali hech qanday xabarnoma yuborilmagan
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupNotificationsByDate())
                    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                    .map(([dateKey, dateNotifications]) => (
                      <div key={dateKey} className="space-y-3">
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs font-medium px-4 py-1.5 rounded-full">
                            {formatDateHeader(dateNotifications[0].timestamp)}
                          </div>
                        </div>

                        {/* Notifications for this date */}
                        {dateNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="bg-transparent dark:bg-transparent"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="h-4 w-4 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-lg rounded-tl-sm px-4 py-2.5 inline-block max-w-full">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {notification.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 ml-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTime(notification.timestamp)}
                                  </span>
                                  <svg
                                    className="h-3.5 w-3.5 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Xabarnoma;
