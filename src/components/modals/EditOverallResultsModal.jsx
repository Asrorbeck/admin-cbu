import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const EditOverallResultsModal = ({ isOpen, onClose, user, onSave }) => {
  const languageLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const [formData, setFormData] = useState({
    test_score: "",
    test_max_score: 100,
    test_percentage: "",
    test_passed: true,
    russian_level: "",
    english_level: "",
    meeting_attended: true,
    required_russian_level: "",
    required_english_level: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        test_score: user.test_score || "",
        test_max_score: user.test_max_score || 100,
        test_percentage: user.test_percentage || "",
        test_passed: user.test_passed !== undefined ? user.test_passed : true,
        russian_level: user.russian_level || "",
        english_level: user.english_level || "",
        meeting_attended: user.meeting_attended !== null ? user.meeting_attended : true,
        required_russian_level: user.required_russian_level || "",
        required_english_level: user.required_english_level || "",
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-calculate percentage if score or max_score changes
      if (name === "test_score" || name === "test_max_score") {
        const score = name === "test_score" ? parseFloat(value) || 0 : prev.test_score;
        const maxScore = name === "test_max_score" ? parseFloat(value) || 100 : prev.test_max_score;
        if (maxScore > 0) {
          newData.test_percentage = ((score / maxScore) * 100).toFixed(2);
        }
      }

      return newData;
    });
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

    // Test natijalari validatsiyasi
    if (!formData.test_score || formData.test_score < 0) {
      toast.error("Test balli kiritilishi shart");
      return;
    }

    if (!formData.test_max_score || formData.test_max_score <= 0) {
      toast.error("Maksimal ball kiritilishi shart");
      return;
    }

    // Til suhbati validatsiyasi
    if (!formData.meeting_attended) {
      // Meetingga kirmagan bo'lsa, til darajalari majburiy emas
    } else {
      if (!formData.russian_level) {
        toast.error("Rus tili darajasi tanlanishi shart");
        return;
      }

      if (!formData.english_level) {
        toast.error("Ingliz tili darajasi tanlanishi shart");
        return;
      }
    }

    try {
      setLoading(true);

      // Test natijasini hisoblash
      const testScore = parseFloat(formData.test_score);
      const testMaxScore = parseFloat(formData.test_max_score);
      const testPercentage = testMaxScore > 0 ? (testScore / testMaxScore) * 100 : 0;
      const testPassed = formData.test_passed;

      // Til suhbati natijasini hisoblash
      let languageInterviewPassed = false;
      let overallPassed = false;

      if (!formData.meeting_attended) {
        languageInterviewPassed = false;
      } else if (formData.russian_level && formData.english_level && formData.required_russian_level && formData.required_english_level) {
        const rusPassed = compareLevel(formData.russian_level, formData.required_russian_level) >= 0;
        const engPassed = compareLevel(formData.english_level, formData.required_english_level) >= 0;
        languageInterviewPassed = rusPassed && engPassed;
      }

      // Umumiy natija
      overallPassed = testPassed && languageInterviewPassed && formData.meeting_attended !== false;

      const updatedUser = {
        ...user,
        test_score: testScore,
        test_max_score: testMaxScore,
        test_percentage: parseFloat(testPercentage.toFixed(2)),
        test_passed: testPassed,
        russian_level: formData.russian_level || null,
        english_level: formData.english_level || null,
        meeting_attended: formData.meeting_attended,
        language_interview_passed: languageInterviewPassed,
        overall_passed: overallPassed,
      };

      // TODO: Replace with actual API call when endpoint is available
      // await updateOverallResultsApi(user.id, updatedUser);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSave && onSave(updatedUser);
      onClose();
    } catch (error) {
      console.error("Error saving overall results:", error);
      toast.error("Natijalarni saqlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const rusPassed =
    formData.russian_level &&
    formData.required_russian_level &&
    compareLevel(formData.russian_level, formData.required_russian_level) >= 0;

  const engPassed =
    formData.english_level &&
    formData.required_english_level &&
    compareLevel(formData.english_level, formData.required_english_level) >= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Natijalarni tahrirlash (Fors Major)
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
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Foydalanuvchi: {user?.user_name || "Ma'lumot yo'q"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vakansiya: {user?.vacancy_title || "Ma'lumot yo'q"}
            </p>
          </div>

          {/* Test Natijalari */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test natijalari
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="test_score"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Test balli *
                </label>
                <input
                  type="number"
                  id="test_score"
                  name="test_score"
                  value={formData.test_score}
                  onChange={handleChange}
                  disabled={loading}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="test_max_score"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Maksimal ball *
                </label>
                <input
                  type="number"
                  id="test_max_score"
                  name="test_max_score"
                  value={formData.test_max_score}
                  onChange={handleChange}
                  disabled={loading}
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="test_percentage"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Foiz (avtomatik)
                </label>
                <input
                  type="number"
                  id="test_percentage"
                  name="test_percentage"
                  value={formData.test_percentage}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="test_passed"
                  name="test_passed"
                  checked={formData.test_passed}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="test_passed"
                  className="ml-3 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Testdan o'tdi
                </label>
              </div>
            </div>
          </div>

          {/* Til Suhbati Natijalari */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Til suhbati natijalari
            </h3>

            {/* Meeting Attended Checkbox */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="meeting_attended"
                  name="meeting_attended"
                  checked={formData.meeting_attended}
                  onChange={handleChange}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Russian Level */}
              <div>
                <label
                  htmlFor="russian_level"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Rus tili darajasi {formData.meeting_attended && "*"}
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
                  {formData.required_russian_level || "Ma'lumot yo'q"}
                </div>
              </div>
            </div>

            {/* Russian Level Status */}
            {formData.russian_level && formData.required_russian_level && formData.meeting_attended && (
              <div className="mt-2 ml-2">
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

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* English Level */}
              <div>
                <label
                  htmlFor="english_level"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Ingliz tili darajasi {formData.meeting_attended && "*"}
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
                  {formData.required_english_level || "Ma'lumot yo'q"}
                </div>
              </div>
            </div>

            {/* English Level Status */}
            {formData.english_level && formData.required_english_level && formData.meeting_attended && (
              <div className="mt-2 ml-2">
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
          </div>

          {/* Overall Status Preview */}
          {formData.test_score && formData.meeting_attended && formData.russian_level && formData.english_level && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Umumiy holat:
              </p>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  formData.test_passed && rusPassed && engPassed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {formData.test_passed && rusPassed && engPassed ? "O'tdi" : "Rad etildi"}
              </span>
            </div>
          )}

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

export default EditOverallResultsModal;

