// utils/translatePsdText.js

export function translatePsdText(text) {
  if (!text) return "";

  let result = text;

  const translationMap = {
    "Particle Size Distribution": "Определение размеров частиц",
    "Contruction of the 1st gas-chemical complex, Phase II":
      "ГЕОТЕХНИЧЕСКИЕ ИЗЫСКАНИЯ НА МОРСКИХ ОБЪЕКТАХ, ПРОЕКТ КАШАГАН ФАЗА IIA",
    "Approved by senior labora": "Утверждено старшим лаборантом",
    "Sample mass (g)": "Масса образца (г)",
    "Sand fraction": "Фракция песка",
    "Lab. Techn": "Техник-лаборант",
    "Made By": "Сделано",
    "U number": "Количество U",
    "Time (sec):": "Время(сек):",
    "Time (sec)": "Время(сек)",
    "Percentage ": "Процент ",
    Project: "Проект",
    Date: "Дата",
    Borehole: "Скважина",
    Technician: "Техник-лаборант",
    Depth: "Глубина",
    Diameter: "Диаметр",
    Dispersity: "Дисперсность",
    Fineness: "Дисперсность",
    Reading: "Показание",
    Percentage: "Процент",
    Time: "Время",
    Sample: "Образец",
    Grams: "грамм",
    gram: "грамм",
    December: "Декабрь",
    November: "Ноябрь",
    October: "Октябрь",
    February: "Февраль",
    September: "Сентябрь",
    January: "Январь",
    August: "Август",
    April: "Апрель",
    March: "Март",
    July: "Июль",
    June: "Июнь",
    May: "Май",
    Sep: "Сентябрь",
    Aug: "Август",
    Jun: "Июнь",
    sec: "сек",
    Dm: "Дм",
    mm: "мм",
    m: "м",
  };

  // Сортируем ключи по длине (от длинных к коротким)
  const sortedKeys = Object.keys(translationMap).sort(
    (a, b) => b.length - a.length
  );

  sortedKeys.forEach((key) => {
    // Экранируем специальные символы regex
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Используем \b только для слов без спецсимволов
    const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(key);
    const regex = hasSpecialChars
      ? new RegExp(escapedKey, "g")
      : new RegExp(`\\b${escapedKey}\\b`, "gi");

    result = result.replace(regex, translationMap[key]);
  });

  return result;
}
