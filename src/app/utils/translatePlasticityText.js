// translatePlasticityText.js

export function translatePlasticityText(text) {
  if (!text) return "";
  let result = text;

  const translationMap = {
    "PLASTICITY CHART": "ГРАФИК ПЛАСТИЧНОСТИ",
    "Offshore Geotechnical Investigation Kashagan Phase IIA Project":
      "Геотехнические изыскания на морских объектах, Проект Кашаган, Фаза IIA",
    "Offshore Geotechnical Investigation":
      "Геотехнические изыскания на морских объектах",
    "Kashagan Phase IIA Project": "Проект Кашаган, Фаза IIA",
    "Report No": "Отчет №",
    "Liquid Limit": "Предел текучести",
    "Plastic Limit": "Предел пластичности",
    "Plasticity Index": "Индекс пластичности",
    "Water cont": "Влажность",
    "4-point liquid limit test": "4-точечная проверка предела текучести",
    Average: "Среднее значение",
    "Depth-ref": "Точка отсчета глуб.",
    "Lab techn.": "Лаборант  ",
    "Lab techn": "Лаборант  ",
    Borehole: "Скважина ",
    Project: "Проект  ",
    Sample: "Образец",
    Date: "Дата",
    Blows: "Удары",
    Plate: "Пластина",
    "(gram)": "  (грамм)",
    Wet: "     Водонас.",
    Dry: "Маловлажн.",
  };

  const sortedKeys = Object.keys(translationMap).sort(
    (a, b) => b.length - a.length
  );

  sortedKeys.forEach((key) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(key);

    const regex = hasSpecialChars
      ? new RegExp(escapedKey, "g")
      : new RegExp(`\\b${escapedKey}\\b`, "gi");

    result = result.replace(regex, translationMap[key]);
  });

  return result;
}
