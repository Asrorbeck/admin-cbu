/**
 * Transliteration utility for converting Uzbek Latin to Cyrillic
 * Converts Latin Uzbek text to Cyrillic Uzbek text
 */

/**
 * Converts Uzbek Latin text to Cyrillic
 * @param {string} text - Latin text to convert
 * @returns {string} - Cyrillic text
 */
export const latinToCyrillic = (text) => {
  if (!text || typeof text !== "string") return "";

  let result = text;

  // Helper function to replace all occurrences
  const replaceAll = (str, search, replace) => {
    return str.split(search).join(replace);
  };

  // Step 1: Handle apostrophe combinations FIRST using regex
  // This will catch ALL apostrophe variants: ', ', ʻ, ʼ, etc.
  // Use Unicode property escapes or character class for apostrophes

  // Define all apostrophe variants as a character class
  const apostropheClass = "['''ʻʼ′‵]"; // All apostrophe variants

  // g' → ғ (case sensitive)
  result = result.replace(new RegExp(`g${apostropheClass}`, "g"), "ғ");
  result = result.replace(new RegExp(`G${apostropheClass}`, "g"), "Ғ");

  // o' → ў (case sensitive)
  result = result.replace(new RegExp(`o${apostropheClass}`, "g"), "ў");
  result = result.replace(new RegExp(`O${apostropheClass}`, "g"), "Ў");

  // e' → ъ (case sensitive)
  result = result.replace(new RegExp(`e${apostropheClass}`, "g"), "ъ");
  result = result.replace(new RegExp(`E${apostropheClass}`, "g"), "Ъ");

  // Step 2: Handle vowel combinations (yo → ё, yu → ю, ya → я)
  const vowelCombinations = [
    ["yo", "ё"],
    ["Yo", "Ё"],
    ["YO", "Ё"],
    ["yu", "ю"],
    ["Yu", "Ю"],
    ["YU", "Ю"],
    ["ya", "я"],
    ["Ya", "Я"],
    ["YA", "Я"],
    ["ye", "е"],
    ["Ye", "Е"],
    ["YE", "Е"],
  ];

  vowelCombinations.forEach(([latin, cyrillic]) => {
    result = replaceAll(result, latin, cyrillic);
  });

  // Step 3: Handle two-character combinations (ch, sh, oo)
  const twoCharMap = [
    ["CH", "Ч"],
    ["Ch", "Ч"],
    ["ch", "ч"],
    ["cH", "ч"],
    ["SH", "Ш"],
    ["Sh", "Ш"],
    ["sh", "ш"],
    ["sH", "ш"],
    ["OO", "Ў"],
    ["Oo", "Ў"],
    ["oo", "ў"],
  ];

  twoCharMap.forEach(([latin, cyrillic]) => {
    result = replaceAll(result, latin, cyrillic);
  });

  // Step 4: Handle single characters (only AFTER all combinations)
  // IMPORTANT: Skip characters that are already Cyrillic
  const cyrillicChars = new Set([
    "ғ",
    "Ғ",
    "ў",
    "Ў",
    "ъ",
    "Ъ",
    "ё",
    "Ё",
    "ю",
    "Ю",
    "я",
    "Я",
    "ч",
    "Ч",
    "ш",
    "Ш",
  ]);

  const singleCharMap = {
    A: "А",
    a: "а",
    B: "Б",
    b: "б",
    V: "В",
    v: "в",
    G: "Г",
    g: "г",
    D: "Д",
    d: "д",
    E: "Е",
    e: "е",
    J: "Ж",
    j: "ж",
    Z: "З",
    z: "з",
    I: "И",
    i: "и",
    Y: "Й",
    y: "й",
    K: "К",
    k: "к",
    L: "Л",
    l: "л",
    M: "М",
    m: "м",
    N: "Н",
    n: "н",
    O: "О",
    o: "о",
    P: "П",
    p: "п",
    R: "Р",
    r: "р",
    S: "С",
    s: "с",
    T: "Т",
    t: "т",
    U: "У",
    u: "у",
    F: "Ф",
    f: "ф",
    X: "Х",
    x: "х",
    H: "Ҳ",
    h: "ҳ",
    C: "Ц",
    c: "ц",
    Q: "Қ",
    q: "қ",
  };

  // Replace single characters (skip already converted Cyrillic chars)
  result = result
    .split("")
    .map((char) => {
      // If already Cyrillic, don't change
      if (cyrillicChars.has(char)) {
        return char;
      }
      return singleCharMap[char] || char;
    })
    .join("");

  return result;
};
