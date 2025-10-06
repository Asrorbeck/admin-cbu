// Sample data for departments
export const departments = [
  {
    id: 1,
    name: "Axborot texnologiyalari bo'limi",
    responsibilities: "IT xizmatlari, tizimlarini boshqarish, texnik yordam",
    obligations:
      "Texnik jihatdan qo'llab-quvvatlash, yangi texnologiyalarni joriy etish",
  },
  {
    id: 2,
    name: "Moliyaviy bo'lim",
    responsibilities: "Byudjetni boshqarish, moliyaviy hisobotlar, to'lovlar",
    obligations: "Moliyaviy nazorat, byudjet rejalashtirish, hisobot berish",
  },
  {
    id: 3,
    name: "Kadrlar bo'limi",
    responsibilities: "Xodimlarni boshqarish, ishga qabul, o'quv jarayonlari",
    obligations: "Kadrlar siyosatini amalga oshirish, xodimlar bilan ishlash",
  },
  {
    id: 4,
    name: "Huquqiy bo'lim",
    responsibilities: "Huquqiy masalalarni hal qilish, shartnomalar tayyorlash",
    obligations: "Huquqiy maslahat berish, qonuniy hujjatlarni ko'rib chiqish",
  },
];

// Sample data for vacancies
export const vacancies = {
  1: [
    {
      id: 1,
      position: "Senior Developer",
      salary: "8000000",
      status: "Active",
      description: "Full-stack development",
    },
    {
      id: 2,
      position: "System Administrator",
      salary: "6000000",
      status: "Active",
      description: "Server va tarmoq boshqaruvi",
    },
    {
      id: 3,
      position: "Junior Developer",
      salary: "4000000",
      status: "Inactive",
      description: "Frontend development",
    },
  ],
  2: [
    {
      id: 4,
      position: "Senior Accountant",
      salary: "7000000",
      status: "Active",
      description: "Moliyaviy hisobotlar",
    },
    {
      id: 5,
      position: "Financial Analyst",
      salary: "5500000",
      status: "Active",
      description: "Moliyaviy tahlil",
    },
  ],
  3: [
    {
      id: 6,
      position: "HR Manager",
      salary: "6500000",
      status: "Active",
      description: "Kadrlar boshqaruvi",
    },
    {
      id: 7,
      position: "Recruiter",
      salary: "4500000",
      status: "Active",
      description: "Ishga qabul jarayonlari",
    },
  ],
  4: [
    {
      id: 8,
      position: "Legal Advisor",
      salary: "7500000",
      status: "Active",
      description: "Huquqiy maslahat",
    },
  ],
};

// Helper functions
export const getDepartmentById = (id) => {
  return departments.find((dept) => dept.id === parseInt(id));
};

export const getVacanciesByDepartmentId = (id) => {
  return vacancies[id] || [];
};

export const addDepartment = (department) => {
  const newId = Math.max(...departments.map((d) => d.id)) + 1;
  departments.push({ ...department, id: newId });
  return newId;
};

export const updateDepartment = (id, updatedDepartment) => {
  const index = departments.findIndex((dept) => dept.id === parseInt(id));
  if (index !== -1) {
    departments[index] = { ...departments[index], ...updatedDepartment };
    return true;
  }
  return false;
};

export const deleteDepartment = (id) => {
  const index = departments.findIndex((dept) => dept.id === parseInt(id));
  if (index !== -1) {
    departments.splice(index, 1);
    return true;
  }
  return false;
};

export const addVacancy = (departmentId, vacancy) => {
  if (!vacancies[departmentId]) {
    vacancies[departmentId] = [];
  }
  const newId =
    Math.max(
      ...Object.values(vacancies)
        .flat()
        .map((v) => v.id)
    ) + 1;
  vacancies[departmentId].push({ ...vacancy, id: newId });
  return newId;
};

export const updateVacancy = (departmentId, vacancyId, updatedVacancy) => {
  if (!vacancies[departmentId]) return false;
  const index = vacancies[departmentId].findIndex(
    (v) => v.id === parseInt(vacancyId)
  );
  if (index !== -1) {
    vacancies[departmentId][index] = {
      ...vacancies[departmentId][index],
      ...updatedVacancy,
    };
    return true;
  }
  return false;
};

export const deleteVacancy = (departmentId, vacancyId) => {
  if (!vacancies[departmentId]) return false;
  const index = vacancies[departmentId].findIndex(
    (v) => v.id === parseInt(vacancyId)
  );
  if (index !== -1) {
    vacancies[departmentId].splice(index, 1);
    return true;
  }
  return false;
};
