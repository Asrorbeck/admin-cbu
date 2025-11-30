import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const EditLanguageInterviewModal = ({ isOpen, onClose, user, onSave }) => {
  const languageLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const [formData, setFormData] = useState({
    russian_level: "",
    english_level: "",
    meeting_attended: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        russian_level: user.russian_level || "",
        english_level: user.english_level || "",
        meeting_attended: user.meeting_attended !== null ? user.meeting_attended : true,
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Compare language levels (A1 < A2 < B1 < B2 < C1 < C2)
  const compareLevel = (level1, level2) => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    if (index1 === -1 || index2 === -1) return 0;
    return index1 - index2;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Agar meetingga kirmagan bo'lsa, til darajalarini tekshirish shart emas
    if (!formData.meeting_attended) {
      // Meetingga kirmagan holatda ham til darajalarini saqlash mumkin (opsional)
      // Lekin passed = false bo'ladi
    } else {
      // Meetingga kirgan bo'lsa, til darajalari majburiy
      if (!formData.russian_level) {
        toast.error("Rus tili darajasi tanlanishi shart");
        return;
      }

      if (!formData.english_level) {
        toast.error("Ingliz tili darajasi tanlanishi shart");
        return;
      }
    }

    // Talab qilinadigan darajalar vakansiyadan keladi (user obyektida)
    if (!user.required_russian_level || !user.required_english_level) {
      toast.error("Vakansiya talablari topilmadi");
      return;
    }

    try {
      setLoading(true);

      // Agar meetingga kirmagan bo'lsa, avtomatik rad etiladi
      if (!formData.meeting_attended) {
        const updatedUser = {
          ...user,
          meeting_attended: false,
          russian_level: formData.russian_level,
          english_level: formData.english_level,
          passed: false,
          status: "rejected",
        };

        // TODO: Replace with actual API call when endpoint is available
        // await updateLanguageInterviewApi(user.id, updatedUser);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        onSave && onSave(updatedUser);
        onClose();
        return;
      }

      // Check if passed (faqat meetingga kirganlar uchun)
      const rusPassed =
        formData.russian_level &&
        compareLevel(formData.russian_level, user.required_russian_level) >= 0;
      const engPassed =
        formData.english_level &&
        compareLevel(
          formData.english_level,
          user.required_english_level
        ) >= 0;
      const passed = rusPassed && engPassed;

      const updatedUser = {
        ...user,
        meeting_attended: true,
        russian_level: formData.russian_level,
        english_level: formData.english_level,
        // required darajalar o'zgarmaydi, ular vakansiyadan keladi
        passed: passed,
        status: passed ? "passed" : "rejected",
      };

      // TODO: Replace with actual API call when endpoint is available
      // await updateLanguageInterviewApi(user.id, updatedUser);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSave && onSave(updatedUser);
      onClose();
    } catch (error) {
      console.error("Error saving language interview results:", error);
      toast.error("Natijalarni saqlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const rusPassed =
    formData.russian_level &&
    user?.required_russian_level &&
    compareLevel(formData.russian_level, user.required_russian_level) >= 0;

  const engPassed =
    formData.english_level &&
    user?.required_english_level &&
    compareLevel(formData.english_level, user.required_english_level) >= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Til suhbati natijalarini yozish
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
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Foydalanuvchi: {user?.user_name || "Ma'lumot yo'q"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vakansiya: {user?.vacancy_title || "Ma'lumot yo'q"}
            </p>
          </div>

          {/* Meeting Attended Checkbox */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="meeting_attended"
                name="meeting_attended"
                checked={formData.meeting_attended}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    meeting_attended: e.target.checked,
                  }));
                }}
                disabled={loading}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="meeting_attended"
                className="ml-3 text-sm font-medium text-gray-900 dark:text-white"
              >
                Meetingga qatnashdi
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Agar meetingga qatnashmagan bo'lsa, foydalanuvchi avtomatik "Rad etildi" statusida bo'ladi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Russian Level */}
            <div>
              <label
                htmlFor="russian_level"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Rus tili darajasi *
              </label>
              <select
                id="russian_level"
                name="russian_level"
                value={formData.russian_level}
                onChange={handleChange}
                disabled={loading || !formData.meeting_attended}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required={formData.meeting_attended}
              >
                <option value="">Tanlang</option>
                {languageLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Required Russian Level - Read Only */}
            <div>
              <label
                htmlFor="required_russian_level"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Talab qilinadigan rus tili
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                {user?.required_russian_level || "Ma'lumot yo'q"}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Vakansiya talablaridan keladi
              </p>
            </div>
          </div>

          {/* Russian Level Status */}
          {formData.russian_level && user?.required_russian_level && (
            <div className="ml-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  rusPassed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {rusPassed ? "✓ Talabga javob beradi" : "✗ Talabga javob bermaydi"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* English Level */}
            <div>
              <label
                htmlFor="english_level"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Ingliz tili darajasi *
              </label>
              <select
                id="english_level"
                name="english_level"
                value={formData.english_level}
                onChange={handleChange}
                disabled={loading || !formData.meeting_attended}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required={formData.meeting_attended}
              >
                <option value="">Tanlang</option>
                {languageLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Required English Level - Read Only */}
            <div>
              <label
                htmlFor="required_english_level"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Talab qilinadigan ingliz tili
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                {user?.required_english_level || "Ma'lumot yo'q"}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Vakansiya talablaridan keladi
              </p>
            </div>
          </div>

          {/* English Level Status */}
          {formData.english_level && user?.required_english_level && (
            <div className="ml-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  engPassed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {engPassed ? "✓ Talabga javob beradi" : "✗ Talabga javob bermaydi"}
              </span>
            </div>
          )}

          {/* Overall Status */}
          {!formData.meeting_attended ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Umumiy holat:
              </p>
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Rad etildi (Meetingga qatnashmadi)
              </span>
            </div>
          ) : formData.russian_level &&
            formData.english_level &&
            user?.required_russian_level &&
            user?.required_english_level ? (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Umumiy holat:
              </p>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  rusPassed && engPassed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {rusPassed && engPassed ? "O'tdi" : "Rad etildi"}
              </span>
            </div>
          ) : null}

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
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLanguageInterviewModal;

