import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { sendMeetLinkInviteApi } from "../../utils/api";

const SendMeetLinkModal = ({ isOpen, onClose, users, selectedDate, onSuccess }) => {
  const [formData, setFormData] = useState({
    meet_link: "",
    interview_date: selectedDate || "",
    interview_time: "",
  });
  const [loading, setLoading] = useState(false);

  // Initialize form with existing meeting details if available
  useEffect(() => {
    if (isOpen && users && users.length > 0) {
      // Check if all users have the same meeting details (for bulk send)
      const firstUser = users[0];
      if (firstUser.meeting_details) {
        setFormData({
          meet_link: firstUser.meeting_details.meet_link || "",
          interview_date: firstUser.meeting_details.meet_date || selectedDate || "",
          interview_time: firstUser.meeting_details.meet_time || "",
        });
      } else {
        // Reset to default if no meeting details
        setFormData({
          meet_link: "",
          interview_date: selectedDate || "",
          interview_time: "",
        });
      }
    }
  }, [isOpen, users, selectedDate]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.meet_link.trim()) {
      toast.error("Google Meet link kiritilishi shart");
      return;
    }

    if (!formData.interview_date) {
      toast.error("Sana tanlanishi shart");
      return;
    }

    if (!formData.interview_time) {
      toast.error("Vaqt kiritilishi shart");
      return;
    }

    try {
      setLoading(true);
      
      // Call API to send meet link invite
      await sendMeetLinkInviteApi({
        attempt_ids: users.map(u => u.id),
        meet_link: formData.meet_link,
        meet_date: formData.interview_date,
        meet_time: formData.interview_time,
      });

      toast.success(
        `${users.length} ta foydalanuvchiga Google Meet link muvaffaqiyatli yuborildi`
      );

      // Pass meet link data to parent component
      onSuccess && onSuccess({
        users: users,
        meet_link: formData.meet_link,
        interview_date: formData.interview_date,
        interview_time: formData.interview_time,
      });
      onClose();
    } catch (error) {
      console.error("Error sending meet link:", error);
      const errorMessage = error.responseData?.detail || 
                          error.responseData?.message || 
                          error.message || 
                          "Meet link yuborishda xatolik yuz berdi";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Google Meet link yuborish
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{users.length}</strong> ta foydalanuvchiga Google Meet link yuboriladi.
              Foydalanuvchilar Telegram orqali bildirishnoma oladi.
            </p>
          </div>

          {/* Show existing meeting details if available */}
          {users && users.length > 0 && users[0].meeting_details && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Mavjud meeting ma'lumotlari:
              </p>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p>
                  <strong>Link:</strong> {users[0].meeting_details.meet_link || "Ma'lumot yo'q"}
                </p>
                <p>
                  <strong>Sana:</strong> {users[0].meeting_details.meet_date || "Ma'lumot yo'q"}
                </p>
                <p>
                  <strong>Vaqt:</strong> {users[0].meeting_details.meet_time || "Ma'lumot yo'q"}
                </p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="meet_link"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Google Meet link *
            </label>
            <input
              type="url"
              id="meet_link"
              name="meet_link"
              value={formData.meet_link}
              onChange={handleChange}
              disabled={loading}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="interview_date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Sana *
              </label>
              <input
                type="date"
                id="interview_date"
                name="interview_date"
                value={formData.interview_date}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label
                htmlFor="interview_time"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Vaqt *
              </label>
              <input
                type="time"
                id="interview_time"
                name="interview_time"
                value={formData.interview_time}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendMeetLinkModal;

