// calculations.js

// Расчет процентного содержания фракции: A = (g_ф / g_1) * 100
export function calculateSieveDry(sieveDryData, soilWeight) {
  const g1 = parseFloat(soilWeight); // Это наш весовой параметр (50 или 100 г)
  if (!g1 || g1 === 0) return {};

  console.log("sivevedrydata", sieveDryData);

  const results = {};

  for (const [key, value] of Object.entries(sieveDryData)) {
    const gPhi = parseFloat(value); // Вес конкретной фракции

    if (!isNaN(gPhi)) {
      results[key] = ((gPhi / g1) * 100).toFixed(2); // Считаем процент и оставляем 2 знака
    } else {
      results[key] = "0.00";
    }
  }

  return results;
}
export  function dryHumidity (dryHumidity, hygroscopic) {

    
}
// Расчет массы абсолютно сухой пробы грунта (g0) по формуле ГОСТ
// g = масса пробы (dryHumidity из инпута)
// W = гигроскопическая влажность в процентах (hygroscopic из инпута)
export function calculateG0(dryHumidity, hygroscopic) {
  const g = parseFloat(dryHumidity);
  const W = parseFloat(hygroscopic);

  // Если значения не введены или некорректны, возвращаем 0 или пустую строку
  if (isNaN(g) || isNaN(W)) return "0.00";

  // Формула: g0 = g / (1 + 0.01 * W)
  const g0 = g / (1 + 0.01 * W);

  return g0.toFixed(2); // Возвращаем строку с двумя знаками после запятой
}

// 2. Расчет ситового анализа с промывкой (формула 4.3.4.3)
export function calculateSieveWash(
  sieveWashData,
  sieveDryData,
  soilWeight,
  dryHumidity,
  hygroscopic,
) {
  // Шаг Б: Считаем формулу 4.3.4.3 для каждой фракции с промывкой: X = (g_n / g_0) * (100 - K)
  const results = {};
  for (const [key, value] of Object.entries(sieveWashData)) {
    if (value === "" || value === null) {
      results[key] = "";
      continue;
    }

    const gN = parseFloat(value); // масса конкретной фракции (gn)
    if (!isNaN(gN)) {
      const X = (gN * 100) / dryHumidity;
      results[key] = X.toFixed(2);
    } else {
      results[key] = "";
    }
  }

  console.log("result", results);

  return {
    sieveWashPercents: results, // посчитанные проценты для 0.5-0.25, 0.25-0.1, <0.1
  };
}

export function calculateAreometer(
  measurements,
  sieveDry,
  soilWeight,
  dryHumidity,
  hygroscopic,
) {
  // Константы по ГОСТу
  const rhoS = 2.73;

  return measurements.map((m) => {
    // m.value — это Rn (показания ареометра с поправками) из инпутов
    const Rn = parseFloat(m.value);

    if (isNaN(Rn)) {
      return { ...m, percent: "—" };
    }

    const A = rhoS * Rn * 100;
    const B = 1.73 * dryHumidity;

    const X = A / B; // Итоговый процент X для данного замера
    console.log("x", X);
    return {
      ...m,
      percent: X.toFixed(2), // Итоговый процент X для данного замера
    };
  });
}

export function processAreometerResults(data) {
  // Проверяем, что в массиве есть как минимум 3 элемента
  if (!data || data.length < 3) return data;

 

  // Парсим проценты в числа для корректного вычитания
  const p1 = parseFloat(data[0].percent);
  const p2 = parseFloat(data[1].percent);
  const p3 = parseFloat(data[2].percent);

  // Вычисляем разницу по вашей логике
  const diff1 = (p1 - p2).toFixed(2); // 23.51 - 14.63 = 8.88
  const diff2 = (p2 - p3).toFixed(2); // 14.63 - 13.06 = 1.57
  const last3 = p3.toFixed(2); // 13.06 остается как есть

  // Возвращаем новый массив объектов с теми же временными метками
  return [
    { time: data[0].time, value: data[0].value, percent: diff1 },
    { time: data[1].time, value: data[1].value, percent: diff2 },
    { time: data[2].time, value: data[2].value, percent: last3 },
  ];
}
