import { useState, useEffect } from "react";
import {
  getOrganizationsApi,
  createOrganizationApi,
  updateOrganizationApi,
  deleteOrganizationApi,
} from "../utils/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const Licenses = () => {
  // State
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  
  // Form
  const [formData, setFormData] = useState({
    inn: "",
    license_number: "",
    issuance_license: "",
    name: "",
    address: "",
  });

  useEffect(() => {
    document.title = "Litsenziyalar - Markaziy Bank Administratsiyasi";
    loadData();
  }, []);

  // Ma'lumotlarni yuklash
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrganizationsApi();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Xatolik yuz berdi");
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Filter qilish
  const filteredData = organizations.filter((org) => {
    const search = searchTerm.toLowerCase();
    return (
      org.name?.toLowerCase().includes(search) ||
      org.inn?.toLowerCase().includes(search) ||
      org.license_number?.toLowerCase().includes(search) ||
      org.address?.toLowerCase().includes(search)
    );
  });

  // Pagination hisoblash
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Modal ochish (yangi)
  const handleAddNew = () => {
    setIsEditMode(false);
    setSelectedOrg(null);
    setFormData({
      inn: "",
      license_number: "",
      issuance_license: "",
      name: "",
      address: "",
    });
    setIsModalOpen(true);
  };

  // Modal ochish (tahrirlash)
  const handleEdit = (org) => {
    setIsEditMode(true);
    setSelectedOrg(org);
    setFormData({
      inn: org.inn || "",
      license_number: org.license_number || "",
      issuance_license: org.issuance_license || "",
      name: org.name || "",
      address: org.address || "",
    });
    setIsModalOpen(true);
  };

  // Modal yopish
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setIsEditMode(false);
      setSelectedOrg(null);
      setFormData({
        inn: "",
        license_number: "",
        issuance_license: "",
        name: "",
        address: "",
      });
    }, 200);
  };

  // Form maydonini yangilash
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validatsiya
  const validate = () => {
    if (!formData.inn.trim()) {
      toast.error("INN kiritilishi shart");
      return false;
    }
    if (!formData.license_number.trim()) {
      toast.error("Litsenziya raqami kiritilishi shart");
      return false;
    }
    if (!formData.issuance_license.trim()) {
      toast.error("Litsenziya berilgan sana kiritilishi shart");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Tashkilot nomi kiritilishi shart");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Manzil kiritilishi shart");
      return false;
    }
    return true;
  };

  // Saqlash
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        inn: formData.inn.trim(),
        license_number: formData.license_number.trim(),
        issuance_license: formData.issuance_license.trim(),
        name: formData.name.trim(),
        address: formData.address.trim(),
      };

      if (isEditMode && selectedOrg) {
        // Yangilash
        await toast.promise(
          updateOrganizationApi(selectedOrg.id, payload),
          {
            loading: "Yangilanmoqda...",
            success: "Litsenziya yangilandi",
            error: (err) => err?.message || "Xatolik yuz berdi",
          }
        );
      } else {
        // Yaratish
        await toast.promise(createOrganizationApi(payload), {
          loading: "Yaratilmoqda...",
          success: "Litsenziya yaratildi",
          error: (err) => err?.message || "Xatolik yuz berdi",
        });
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  // O'chirish
  const handleDelete = async (org) => {
    if (!window.confirm(`"${org.name}" litsenziyasini o'chirishni tasdiqlaysizmi?`)) {
      return;
    }

    try {
      await toast.promise(deleteOrganizationApi(org.id), {
        loading: "O'chirilmoqda...",
        success: "Litsenziya o'chirildi",
        error: (err) => err?.message || "Xatolik yuz berdi",
      });
      loadData();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Sana formatlash
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("uz-UZ");
    } catch {
      return dateString;
    }
  };

  // Excel template yuklab olish
  const downloadExcelTemplate = () => {
    // Template ma'lumotlari
    const templateData = [
      {
        inn: "123456789",
        license_number: "LIC-001",
        issuance_license: "2024-01-15",
        name: "Namuna Tashkilot",
        address: "Toshkent shahri, Chilonzor tumani",
      },
    ];

    // Workbook yaratish
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Ustun kengliklarini sozlash
    ws["!cols"] = [
      { wch: 15 }, // inn
      { wch: 20 }, // license_number
      { wch: 18 }, // issuance_license
      { wch: 30 }, // name
      { wch: 40 }, // address
    ];

    // Sheet qo'shish
    XLSX.utils.book_append_sheet(wb, ws, "Litsenziyalar");

    // Faylni yuklab olish
    XLSX.writeFile(wb, "litsenziyalar_template.xlsx");
    toast.success("Excel shablon yuklab olindi");
  };

  // Import modal ochish
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setImportFile(null);
  };

  // Import modal yopish
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
  };

  // Fayl tanlash
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Excel fayl ekanligini tekshirish
      const validExtensions = [
        ".xlsx",
        ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();
      const isValidType =
        validExtensions.includes(fileExtension) ||
        validExtensions.includes(file.type);

      if (!isValidType) {
        toast.error("Faqat Excel fayllar (.xlsx, .xls) qabul qilinadi");
        return;
      }

      setImportFile(file);
    }
  };

  // Excel faylni import qilish
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Iltimos, fayl tanlang");
      return;
    }

    try {
      setImporting(true);

      // Excel faylni o'qish
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          
          // Birinchi sheetni olish
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // JSON formatiga o'tkazish
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            toast.error("Excel fayl bo'sh");
            setImporting(false);
            return;
          }

          // Har bir qatorni alohida yuborish
          let successCount = 0;
          let errorCount = 0;
          const errors = [];

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Ma'lumotlarni tozalash va formatlash
            const payload = {
              inn: String(row.inn || row.INN || "").trim(),
              license_number: String(row.license_number || row["license_number"] || row["Litsenziya raqami"] || "").trim(),
              issuance_license: String(row.issuance_license || row["issuance_license"] || row["Berilgan sana"] || "").trim(),
              name: String(row.name || row.NAME || row["Tashkilot nomi"] || "").trim(),
              address: String(row.address || row.ADDRESS || row["Manzil"] || "").trim(),
            };

            // Validatsiya
            if (!payload.inn || !payload.license_number || !payload.issuance_license || !payload.name || !payload.address) {
              errorCount++;
              errors.push(`Qator ${i + 2}: Barcha maydonlar to'ldirilishi shart`);
              continue;
            }

            try {
              await createOrganizationApi(payload);
              successCount++;
            } catch (error) {
              errorCount++;
              const errorMsg = error?.responseData?.detail || error?.message || "Xatolik yuz berdi";
              errors.push(`Qator ${i + 2}: ${errorMsg}`);
            }
          }

          // Natijalarni ko'rsatish
          if (successCount > 0) {
            toast.success(`${successCount} ta litsenziya muvaffaqiyatli qo'shildi`);
          }
          
          if (errorCount > 0) {
            toast.error(`${errorCount} ta qatorda xatolik yuz berdi`);
            console.error("Import xatoliklari:", errors);
          }

          handleCloseImportModal();
          loadData();
        } catch (error) {
          console.error("Excel o'qish xatosi:", error);
          toast.error("Excel faylni o'qishda xatolik yuz berdi");
        } finally {
          setImporting(false);
        }
      };

      fileReader.onerror = () => {
        toast.error("Faylni o'qishda xatolik yuz berdi");
        setImporting(false);
      };

      // Faylni array buffer sifatida o'qish
      fileReader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import qilishda xatolik yuz berdi");
      setImporting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sarlavha va qo'shish tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Litsenziyalar
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Tashkilotlar litsenziyalarini boshqarish
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenImportModal}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import qilish
          </button>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Yangi litsenziya qo'shish
          </button>
        </div>
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

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Filter o'zgarganda birinchi sahifaga qaytish
          }}
          placeholder="Qidirish (nomi, INN, litsenziya raqami, manzil)..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Jadval */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? "Qidiruv natijasi topilmadi" : "Litsenziyalar yo'q"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      INN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Litsenziya raqami
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tashkilot nomi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Manzil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Berilgan sana
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentData.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {org.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {org.inn || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {org.license_number || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {org.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {org.address || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(org.issuance_license)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(org)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Tahrirlash"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(org)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50"
                  >
                    Oldingi
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50"
                  >
                    Keyingi
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">
                        {startIndex + 1}-{Math.min(endIndex, filteredData.length)}
                      </span>{" "}
                      dan <span className="font-medium">{filteredData.length}</span> ta
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300"
                                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - Yangi/Tahrirlash */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={handleCloseModal}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditMode ? "Litsenziyani tahrirlash" : "Yangi litsenziya qo'shish"}
                </h3>
                <button
                  onClick={handleCloseModal}
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
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    INN *
                  </label>
                  <input
                    type="text"
                    value={formData.inn}
                    onChange={(e) => updateField("inn", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="INN raqami"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Litsenziya raqami *
                  </label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => updateField("license_number", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Litsenziya raqami"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Berilgan sana *
                  </label>
                  <input
                    type="date"
                    value={formData.issuance_license}
                    onChange={(e) => updateField("issuance_license", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tashkilot nomi *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Tashkilot nomi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manzil *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Manzil"
                  />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={handleCloseImportModal}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Excel orqali import qilish
                </h3>
                <button
                  onClick={handleCloseImportModal}
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
              <div className="px-6 py-5 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                    <strong>Eslatma:</strong> Excel fayl quyidagi formatda bo'lishi kerak:
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                    <li>INN - INN raqami (majburiy)</li>
                    <li>license_number - Litsenziya raqami (majburiy)</li>
                    <li>issuance_license - Berilgan sana (YYYY-MM-DD formatida, majburiy)</li>
                    <li>name - Tashkilot nomi (majburiy)</li>
                    <li>address - Manzil (majburiy)</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadExcelTemplate}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel shablon yuklab olish
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excel fayl tanlash
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Fayl tanlash</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">yoki drag & drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        .xlsx, .xls fayllar qabul qilinadi
                      </p>
                      {importFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          ✓ {importFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleCloseImportModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? "Import qilinmoqda..." : "Import qilish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Licenses;

