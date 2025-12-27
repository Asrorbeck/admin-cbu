// Static requirements that are always included in vacancy requirements
export const staticRequirements = {
  uz: [
    "Xalqaro va milliy sertifikatlarning mavjudligiga ustuvorlik beriladi.",
    "Davlat tilini mukammal bilishi, barcha xat-hujjatlarni kirill va lotin alifbosida orfografik va grammatik xatolarsiz yoza olishi lozim.",
    "O'zbekiston Respublikasining Konstitutsiyasi, \"O'zbekiston Respublikasining Markaziy banki to'g'risida\"gi, \"Banklar va bank faoliyati to'g'risida\"gi hamda bank tizimiga doir boshqa turdagi qaror va farmonlardan xabardor bo'lish lozim.",
    "MS Office (Word, Excel, Power Point, Outlook) dasturlarida erkin ishlay olishi lozim.",
    "Mas'uliyatli hamda jamoa bilan ishlay olishi, yangiliklarga intiluvchan, o'z ustida ishlay olishi lozim.",
  ],
  cr: [
    "Халқаро ва миллий сертификатларнинг мавжудлигига устуворлик берилади.",
    "Давлат тилини мукаммал билиши, барча хат-ҳужжатларни кирилл ва лотин алифбосида орфографик ва грамматик хатоларсиз ёза олиши лозим.",
    "Ўзбекистон Республикасининг Конституцияси, \"Ўзбекистон Республикасининг Марказий банки тўғрисида\"ги, \"Банклар ва банк фаолияти тўғрисида\"ги ҳамда банк тизимига доир бошқа турдаги қарор ва фармонлардан хабардор бўлиш лозим.",
    "MS Office (Word, Excel, Power Point, Outlook) дастурларида эркин ишлай олиши лозим.",
    "Масъулиятли ҳамда жамоа билан ишлай олиши, янгиликларга интилувчан, ўз устида ишлай олиши лозим.",
  ],
  ru: [
    "Приоритет отдается наличию международных и национальных сертификатов.",
    "Отличное знание государственного языка, умение писать все письма и документы кириллицей и латинским алфавитом без орфографических и грамматических ошибок.",
    "Знание Конституции Республики Узбекистан, Закона «О Центральном банке Республики Узбекистан», «О банках и банковской деятельности» и других постановлений и указов, касающихся банковской системы.",
    "Умение свободно работать в программах MS Office (Word, Excel, PowerPoint, Outlook).",
    "Ответственность, умение работать в команде, стремление к инновациям, способность к самосовершенствованию.",
  ],
};

// Helper function to merge static requirements with existing requirements
export const mergeStaticRequirements = (existingRequirements, lang) => {
  const staticReqs = staticRequirements[lang] || [];
  const staticReqsAsObjects = staticReqs.map((req) => ({ task: req }));
  
  // Check if static requirements already exist
  const existingReqsArray = Array.isArray(existingRequirements) 
    ? existingRequirements 
    : [];
  
  // Filter out static requirements if they already exist
  const filteredExisting = existingReqsArray.filter((req) => {
    const reqText = typeof req === 'string' ? req : req.task || '';
    return !staticReqs.some(staticReq => staticReq === reqText);
  });
  
  // Merge: static requirements first, then existing ones, then empty field
  return [...staticReqsAsObjects, ...filteredExisting, { task: "" }];
};

// Helper function to get static requirements as objects
export const getStaticRequirementsAsObjects = () => {
  return {
    uz: staticRequirements.uz.map((req) => ({ task: req })),
    cr: staticRequirements.cr.map((req) => ({ task: req })),
    ru: staticRequirements.ru.map((req) => ({ task: req })),
  };
};

