import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const SendInterviewNotificationModal = ({ isOpen, onClose, users, selectedDate, onSuccess }) => {
  const [formData, setFormData] = useState({
    online_meet_link: "",
    online_interview_date: selectedDate || "",
    online_interview_time: "",
    offline_interview_date: selectedDate || "",
    offline_interview_time: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedDate) {
      setFormData((prev) => ({
        ...prev,
        online_interview_date: selectedDate,
        offline_interview_date: selectedDate,
      }));
    }
  }, [isOpen, selectedDate]);

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

    // Onlayn userlar uchun validatsiya
    if (!formData.online_meet_link.trim()) {
      toast.error("Onlayn suhbat uchun Google Meet link kiritilishi shart");
      return;
    }

    if (!formData.online_interview_date) {
      toast.error("Onlayn suhbat sanasi tanlanishi shart");
      return;
    }

    if (!formData.online_interview_time) {
      toast.error("Onlayn suhbat vaqti kiritilishi shart");
      return;
    }

    // Oflayn userlar uchun validatsiya
    if (!formData.offline_interview_date) {
      toast.error("Oflayn suhbat sanasi tanlanishi shart");
      return;
    }

    if (!formData.offline_interview_time) {
      toast.error("Oflayn suhbat vaqti kiritilishi shart");
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Replace with actual API call when endpoint is available
      // await sendInterviewNotificationApi({
      //   users: users.map(u => u.id),
      //   online_meet_link: formData.online_meet_link,
      //   online_interview_date: formData.online_interview_date,
      //   online_interview_time: formData.online_interview_time,
      //   offline_interview_date: formData.offline_interview_date,
      //   offline_interview_time: formData.offline_interview_time,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `${users.length} ta foydalanuvchiga bildirishnoma muvaffaqiyatli yuborildi`
      );
      
      // TODO: Send Telegram notifications
      // Foydalanuvchilar Telegram orqali bildirishnoma oladi va onlayn/oflayn tanlaydi
      // Onlayn tanlaganlar: meet link, sana, vaqt oladi
      // Oflayn tanlaganlar: sana, vaqt oladi
      // await sendTelegramNotifications(users, formData);

      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Bildirishnoma yuborishda xatolik yuz berdi");
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
              Bildirishnoma yuborish
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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{users.length}</strong> ta foydalanuvchiga bildirishnoma yuboriladi.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Foydalanuvchilar Telegram orqali bildirishnoma oladi va suhbat shaklini tanlaydi (Onlayn/Oflayn).
            </p>
          </div>

          {/* Onlayn Suhbat Ma'lumotlari */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Onlayn suhbat ma'lumotlari
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Onlayn tanlagan foydalanuvchilar uchun Google Meet link, sana va vaqt.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="online_meet_link"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Google Meet link *
                </label>
                <input
                  type="url"
                  id="online_meet_link"
                  name="online_meet_link"
                  value={formData.online_meet_link}
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
                    htmlFor="online_interview_date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Suhbat sanasi *
                  </label>
                  <input
                    type="date"
                    id="online_interview_date"
                    name="online_interview_date"
                    value={formData.online_interview_date}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="online_interview_time"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Suhbat vaqti *
                  </label>
                  <input
                    type="time"
                    id="online_interview_time"
                    name="online_interview_time"
                    value={formData.online_interview_time}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Oflayn Suhbat Ma'lumotlari */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Oflayn suhbat ma'lumotlari
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Oflayn tanlagan foydalanuvchilar uchun sana va vaqt.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="offline_interview_date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Suhbat sanasi *
                </label>
                <input
                  type="date"
                  id="offline_interview_date"
                  name="offline_interview_date"
                  value={formData.offline_interview_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="offline_interview_time"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Suhbat vaqti *
                </label>
                <input
                  type="time"
                  id="offline_interview_time"
                  name="offline_interview_time"
                  value={formData.offline_interview_time}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  required
                />
              </div>
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
              className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendInterviewNotificationModal;

