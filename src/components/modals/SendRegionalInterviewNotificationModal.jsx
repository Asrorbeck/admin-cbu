import { useState } from "react";
import toast from "react-hot-toast";
import { sendRegionalFinalInterviewInviteApi } from "../../utils/api";

const MESSAGE = `Hurmatli nomzod

Siz tanlovning birinchi bosqichi: Test va til bo'yicha suhbatdan muvaffaqiyatli o'tdingiz.
Navbatdagi bosqich - Ekspert guruhi bilan suhbat. Tez orada hududiy bosh boshqarmaning kadrlar xizmati xodimi siz bilan bog‘lanib, suhbat vaqti va joyini ma’lum qiladi.

Ushbu bosqichda sizga omad tilaymiz. Bilim va salohiyatingizni ko‘rsatib, ijobiy natijaga erishishingizga tilakdoshmiz.
`;

const SendRegionalInterviewNotificationModal = ({
  isOpen,
  onClose,
  users,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!users || users.length === 0) {
      toast.error("Yuborish uchun foydalanuvchilar yo'q");
      return;
    }

    try {
      setLoading(true);
      const attemptIds = users.map((u) => u.id);
      await sendRegionalFinalInterviewInviteApi({ attempt_ids: attemptIds });
      toast.success(
        `${users.length} ta foydalanuvchiga bildirishnoma muvaffaqiyatli yuborildi`
      );
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sending regional notification:", error);
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
              Bildirishnoma yuborish (Hududiy boshqarmalar)
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

        <div className="px-6 py-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{users?.length || 0}</strong> ta foydalanuvchiga
              bildirishnoma yuboriladi.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Hududiy boshqarmalar uchun Google Meet link yoki oflayn uchrashuv
              vaqti yuborilmaydi.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Yuboriladigan xabar
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {MESSAGE}
            </pre>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendRegionalInterviewNotificationModal;

