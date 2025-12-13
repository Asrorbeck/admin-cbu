import { useState, useEffect } from "react";
import {
  getFaqCategoriesApi,
  createFaqCategoryApi,
  updateFaqCategoryApi,
  deleteFaqCategoryApi,
} from "../utils/api";
import toast from "react-hot-toast";

const KorrupsiyaFAQCategories = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null); // Mavjud kategoriya

  // Form ma'lumotlari
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
    order: 1,
    items: [],
  });

  // Dastlabki yuklash
  useEffect(() => {
    document.title =
      "Korrupsiya murojaatlari - FAQ Kategoriyalari - Markaziy Bank Administratsiyasi";
    loadData();
  }, []);

  // Ma'lumotlarni yuklash
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFaqCategoriesApi("reports");
      
      // Handle paginated response structure: { count, next, previous, results: [...] }
      const categoriesList = data?.results || (Array.isArray(data) ? data : []);

      if (categoriesList.length > 0) {
        // Kategoriya mavjud - tahrirlash rejimi
        const existing = categoriesList[0];
        setCategory(existing);
        setForm({
          name: existing.name || "",
          slug: existing.slug || "",
          description: existing.description || "",
          is_active: existing.is_active ?? true,
          order: existing.order || 1,
          items: existing.items || [],
        });
      } else {
        // Kategoriya yo'q - yangi qo'shish rejimi
        setCategory(null);
        resetForm();
      }
    } catch (e) {
      setError(e.message || "Xatolik yuz berdi");
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Formni tozalash
  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      is_active: true,
      order: 1,
      items: [],
    });
  };

  // Slug yaratish (nomdan)
  const createSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Nom o'zgarganda slug avtomatik yangilanadi
  const updateName = (name) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: createSlug(name),
    }));
  };

  // Form maydonini yangilash
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Savol qo'shish
  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          question: "",
          answer: "",
          is_active: true,
          order: prev.items.length + 1,
        },
      ],
    }));
  };

  // Savolni o'chirish
  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i + 1 })),
    }));
  };

  // Savol ma'lumotlarini yangilash
  const updateQuestion = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Savol tartibini o'zgartirish
  const moveQuestion = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === form.items.length - 1)
    ) {
      return;
    }

    setForm((prev) => {
      const items = [...prev.items];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return {
        ...prev,
        items: items.map((item, i) => ({ ...item, order: i + 1 })),
      };
    });
  };

  // Form validatsiyasi
  const validate = () => {
    if (!form.name.trim()) {
      toast.error("Kategoriya nomi kiritilishi shart");
      return false;
    }
    if (form.items.length === 0) {
      toast.error("Kamida bitta savol-javob qo'shishingiz kerak");
      return false;
    }
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.question.trim()) {
        toast.error(`${i + 1}-savol matni kiritilishi shart`);
        return false;
      }
      if (!item.answer.trim()) {
        toast.error(`${i + 1}-savol javobi kiritilishi shart`);
        return false;
      }
    }
    return true;
  };

  // Saqlash
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        faq_category: "reports",
        is_active: form.is_active,
        order: form.order,
        items: form.items.map((item) => ({
          ...(item.id && { id: item.id }),
          question: item.question.trim(),
          answer: item.answer.trim(),
          is_active: item.is_active,
          order: item.order,
        })),
      };

      let result;
      if (category) {
        // Yangilash
        result = await toast.promise(
          updateFaqCategoryApi(category.id, payload),
          {
            loading: "Saqlanmoqda...",
            success: "FAQ kategoriya yangilandi",
            error: (err) => err?.message || "Xatolik yuz berdi",
          }
        );
      } else {
        // Yaratish
        result = await toast.promise(createFaqCategoryApi(payload, "reports"), {
          loading: "Yaratilmoqda...",
          success: "FAQ kategoriya yaratildi",
          error: (err) => err?.message || "Xatolik yuz berdi",
        });
      }

      if (result) {
        setCategory(result);
        setForm({
          name: result.name || "",
          slug: result.slug || "",
          description: result.description || "",
          is_active: result.is_active ?? true,
          order: result.order || 1,
          items: result.items || [],
        });
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  // O'chirish
  const handleDelete = async () => {
    if (!category) return;
    if (!window.confirm("FAQ kategoriyani o'chirishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      await toast.promise(deleteFaqCategoryApi(category.id), {
        loading: "O'chirilmoqda...",
        success: "FAQ kategoriya o'chirildi",
        error: (err) => err?.message || "Xatolik yuz berdi",
      });
      setCategory(null);
      resetForm();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Loading holati
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            FAQ Kategoriyalari
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Korrupsiya murojaatlari bo'yicha tez-tez so'raladigan savollar kategoriyasini boshqarish
          </p>
        </div>
        {category && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            O'chirish
          </button>
        )}
      </div>

      {/* Xatolik */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Asosiy forma */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Kategoriya ma'lumotlari */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kategoriya ma'lumotlari
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategoriya nomi *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Masalan: Tez-tez so'raladigan savollar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug <span className="text-xs text-gray-500">(avtomatik)</span>
            </label>
            <input
              type="text"
              value={form.slug}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tavsif
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Kategoriya haqida qisqacha ma'lumot"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Faol
              </span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tartib
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  updateField("order", parseInt(e.target.value) || 1)
                }
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Savol-Javoblar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Savol-Javoblar ({form.items.length})
            </h2>
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              + Savol qo'shish
            </button>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hozircha savol-javoblar yo'q. Yangi savol qo'shing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {form.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                >
                  {/* Boshqaruv tugmalari */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => moveQuestion(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Yuqoriga ko'tarish"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveQuestion(index, "down")}
                        disabled={index === form.items.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Pastga tushirish"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) =>
                            updateQuestion(index, "is_active", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                          Faol
                        </span>
                      </label>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        title="O'chirish"
                      >
                        <svg
                          className="w-5 h-5"
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
                  </div>

                  {/* Savol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Savol *
                    </label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) =>
                        updateQuestion(index, "question", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Savol matni"
                    />
                  </div>

                  {/* Javob */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Javob *
                    </label>
                    <textarea
                      value={item.answer}
                      onChange={(e) =>
                        updateQuestion(index, "answer", e.target.value)
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Javob matni"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saqlash tugmasi */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda..." : category ? "Yangilash" : "Yaratish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KorrupsiyaFAQCategories;

