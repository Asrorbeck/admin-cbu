import { useState, useEffect, useRef } from "react";
import { getApplicationsApi } from "../utils/api";
import { getNotificationsApi, broadcastApplicantsApi } from "../utils/api";
import toast from "react-hot-toast";

const Xabarnoma = () => {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [applications, setApplications] = useState([]);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [messageText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notifications]);

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

      await broadcastApplicantsApi(messageText.trim());

      const updated = [newNotification, ...notifications];
      setNotifications(updated);
      localStorage.setItem("xabarnoma_notifications", JSON.stringify(updated));

      toast.success(
        `${applications.length} ta foydalanuvchiga xabarnoma yuborildi`,
      );

      setMessageText("");
    } catch (error) {
      console.error("Error sending notification:", error);
      setNotifications(notifications);
      localStorage.setItem(
        "xabarnoma_notifications",
        JSON.stringify(notifications),
      );

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

  return (
    <div
      className="flex flex-col -mx-6 -my-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden"
      style={{ height: "91vh", minHeight: 0 }}
    >
      <div
        className="flex-1 flex overflow-hidden min-h-0"
        style={{ minHeight: 0 }}
      >
        {/* Main Content — Telegram uslubi: tepada xabarlar, pastda yozish maydoni */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-800/50">
          {/* Tepada: sarlavha qotib, faqat xabarlar ro'yxati skrol qiladi */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Yuborilgan xabarnomalar
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Barcha ariza topshirganlar uchun
              </p>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <svg
                    className="h-14 w-14 text-gray-300 dark:text-gray-600 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Hali xabarnoma yuborilmagan. Pastdagi maydon orqali
                    yuboring.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-2">
                  {Object.entries(groupNotificationsByDate())
                    .sort(
                      ([dateA], [dateB]) => new Date(dateB) - new Date(dateA),
                    )
                    .map(([dateKey, dateNotifications]) => (
                      <div key={dateKey} className="space-y-3">
                        <div className="flex items-center justify-center my-2">
                          <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
                            {formatDateHeader(dateNotifications[0].timestamp)}
                          </span>
                        </div>
                        {dateNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="flex items-start gap-3"
                          >
                            <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                              <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-2xl rounded-tl-md px-4 py-2.5 inline-block max-w-full shadow-sm">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {notification.message}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 ml-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(notification.timestamp)}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  • {notification.recipientCount ?? 0} ta qabul
                                  qiluvchi
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Pastda: yozish maydoni (Telegram-style) */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <form
              onSubmit={handleSendNotification}
              className="flex gap-3 items-center"
            >
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Xabarnoma matnini yozing..."
                  rows={1}
                  style={{ resize: "none" }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-h-[120px]"
                />
              </div>
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-md transition-colors"
                title="Yuborish"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
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
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Xabarnoma;
