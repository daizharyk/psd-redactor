import { Paragraph, ImageRun } from "docx";
import { createCanvas } from "canvas";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

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
    "<0.1 мм",
  ];

  const values = [
    parseFloat(data.f10_p) || 0,
    parseFloat(data.f5_2_p) || 0,
    parseFloat(data.f2_1_p) || 0,
    parseFloat(data.f1_05_p) || 0,
    parseFloat(data.f05_025_p) || 0,
    parseFloat(data.f025_01_p) || 0,
    parseFloat(data.fLess1_p) || 0,
  ];

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
          fill: false,
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Содержание, %" },
        },
        x: {
          title: { display: true, text: "Размер частиц, мм" },
        },
      },
    },
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
              width: 600,
              height: 500,
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
