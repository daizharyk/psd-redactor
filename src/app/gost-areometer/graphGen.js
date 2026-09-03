import { Paragraph, ImageRun } from "docx";
import { createCanvas, registerFont } from "canvas";
import { Chart, registerables } from "chart.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

Chart.register(...registerables);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontPath = path.join(__dirname, "fonts", "arial.ttf");

// Защита от повторной регистрации при HMR/повторном импорте модуля
if (!globalThis.__arialFontRegistered) {
  try {
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: "Arial" });
      globalThis.__arialFontRegistered = true;
      console.log("✅ Шрифт зарегистрирован:", fontPath);
    } else {
      console.error("❌ ФАЙЛ ШРИФТА НЕ НАЙДЕН:", fontPath);
    }
  } catch (e) {
    console.error("⚠️ Ошибка при регистрации шрифта:", e.message);
  }
}

export async function generateGraphSection(data) {
  const width = 600;
  const height = 500;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const labels = [
    "10 мм",
    "5 мм",
    "2 мм",
    "1 мм",
    "0.5 мм",
    "0.25 мм",
    "0.1 мм",
    ...(data.measurements || []).map((_, index) => {
      if (index === 0) return "0.05 - 0.01 мм";
      if (index === 1) return "0.01 - 0.002 мм";
      return "< 0.002 мм";
    }),
    "",
  ];

  const rawValues = [
    parseFloat(data.f10_p) || 0,
    parseFloat(data.f5_2_p) || 0,
    parseFloat(data.f2_1_p) || 0,
    parseFloat(data.f1_05_p) || 0,
    parseFloat(data.f05_025_p) || 0,
    parseFloat(data.f025_01_p) || 0,
    parseFloat(data.fLess1_p) || 0,
    ...(data.measurements || []).map((m) => parseFloat(m.percent) || 0),
    0,
  ];

  // 2. Считаем кумуляцию стандартным циклом справа налево
  const values = new Array(rawValues.length).fill(null);

  let runningSum = 0;
  let hasStarted = false;

  for (let i = rawValues.length - 1; i >= 0; i--) {
    const val = rawValues[i];

    if (val > 0) {
      hasStarted = true;
    }

    if (!hasStarted) {
      continue;
    }

    runningSum += val;

    if (val <= 0) {
      values[i] = null;
      continue;
    }

    values[i] = Math.min(parseFloat(runningSum.toFixed(2)), 100);
  }

  // 3. Вставляем дубликат точки прямо перед последним измерением (< 0.002 мм)
  const measurementsCount = (data.measurements || []).length;
  if (measurementsCount > 0) {
    // Индекс последнего реального измерения в массиве rawValues
    // (7 фиксированных сит + индекс последнего измерения)
    const lastMeasIndex = 7 + measurementsCount - 1;

    if (lastMeasIndex >= 0 && lastMeasIndex < rawValues.length) {
      const lastVal = rawValues[lastMeasIndex];
      const lastComputedVal = values[lastMeasIndex];

      // Вставляем дубликат в rawValues и values перед последним элементом
      // Дубликат получает ровно то же значение и НЕ участвует в повторном суммировании!
      rawValues.splice(lastMeasIndex, 0, lastVal);
      values.splice(lastMeasIndex, 0, lastComputedVal);
    }
  }
  // Кастомный плагин для отрисовки блоков разновидности грунтов в нижней части графика
  // Кастомный плагин для отрисовки ячеек разновидности грунтов с полноценными рамками
  const soilClassificationPlugin = {
    id: "soilClassification",
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const xAxis = scales.x;
      const bottomY = chartArea.bottom; // Низ области графика
      const boxHeight = 42; // Немножко уменьшили высоту, чтобы нижняя линия не обрезалась

      ctx.save();
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const ranges = [
        { startIdx: 0, endIdx: 2, text: "Гравий" },
        { startIdx: 2, endIdx: 7, text: "Песчаные" },
        {
          startIdx: 7,
          endIdx: labels.length - 2,
          text: "Пылеватые",
        },
        {
          startIdx: labels.length - 2,
          endIdx: labels.length - 1,
          text: "Глинистые",
        },
      ];

      // Сначала рисуем общий контур/подложку для всех ячеек, чтобы нижняя линия точно была
      ranges.forEach((range) => {
        const sIdx = Math.max(0, range.startIdx);
        const eIdx = Math.min(xAxis.ticks.length - 1, range.endIdx);

        if (sIdx >= eIdx) return;

        const startX = xAxis.getPixelForTick(sIdx);
        const endX = xAxis.getPixelForTick(eIdx);
        const boxWidth = endX - startX;

        // Белый фон ячейки
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(startX, bottomY, boxWidth, boxHeight);

        // Рисуем рамку ячейки
        ctx.strokeStyle = "#b8b8b8"; // Сделали цвет чуть контрастнее для видимости
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, bottomY, boxWidth, boxHeight);

        // Текст по центру
        ctx.fillStyle = "#000000";
        ctx.fillText(
          range.text,
          startX + boxWidth / 2,
          bottomY + boxHeight / 2,
        );
      });

      ctx.restore();
    },
  };

  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Кривая гранулометрического состава (%)",
          data: values,
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          tension: 0.2,
          borderWidth: 1.2,
          fill: false,
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: {
        legend: {
          labels: {
            usePointStyle: true, // Включаем использование точек/стилей для иконки в легенде
            pointStyle: "line", // Меняем форму иконки с квадрата на линию
          },
        },
        soilClassification: soilClassificationPlugin, // Ваш плагин грунтов
      },
      layout: {
        padding: {
          bottom: 50,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Содержание, %" },
        },
        x: {
          position: "top", // <-- Переносит подписи оси X наверх графика
          title: { display: true, text: "Размер частиц, мм" },
          ticks: {
            font: {
              size: 10, // Уменьшаем шрифт, чтобы подписи не накладывались друг на друга
            },
          },
        },
      },
    },
    plugins: [soilClassificationPlugin],
  };

  try {
    new Chart(ctx, configuration);
    const imageBuffer = canvas.toBuffer("image/png");

    return [
      new Paragraph({
        text: "",
        spacing: { before: 200 },
      }),
      new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            // Строго соблюдаем пропорции 600x350
            transformation: {
              width: 630,
              height: 550,
            },
            type: "png",
          }),
        ],
      }),
    ];
  } catch (error) {
    console.error("Ошибка при генерации графика через Chart.js:", error);
    return [
      new Paragraph({
        children: [
          new TextRun({ text: "[Не удалось сгенерировать графический файл]" }),
        ],
      }),
    ];
  }
}
