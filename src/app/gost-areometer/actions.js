"use server";

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  TextRun,
  Footer,
} from "docx";

import {
  calculateAreometer,
  calculateSieveDry,
  calculateSieveWash,
  processAreometerResults,
} from "./calculations";
import { generateGraphSection } from "./graphGen";

export async function generateReport(formData) {
  const {
    projectNumber,
    sampleId,
    mineNumber,
    depth,
    testDate,
    hygroscopic,
    dryHumidity,
    soilWeight,
    sieveDry,
    sieveWash,
    measurements,
  } = formData;

  // 1. Считаем проценты по формуле для сухого сита
  const sieveDryPercents = calculateSieveDry(sieveDry, soilWeight);

  const areometerResults = calculateAreometer(
    measurements,
    sieveDry,
    soilWeight,
    dryHumidity,
    hygroscopic,
  );

  // 2. Считаем проценты по формуле 4.3.4.3 для сит с промывкой (+ получаем сумму K)
  const { sieveWashPercents, K } = calculateSieveWash(
    sieveWash,
    sieveDry,
    soilWeight,
    dryHumidity,
    hygroscopic,
  );

  const updatedResults = processAreometerResults(areometerResults);

  const f1_05_val = parseFloat(sieveWashPercents.f1_05 || "0");
  const f05_025_val = parseFloat(sieveWashPercents.f05_025 || "0");
  const f025_01_val = parseFloat(sieveWashPercents.f025_01 || "0");
  const areometerOne = updatedResults[0]
    ? parseFloat(updatedResults[0].percent)
    : 0;
  const areometerTwo = updatedResults[1]
    ? parseFloat(updatedResults[1].percent)
    : 0;
  const areometerThree = updatedResults[2]
    ? parseFloat(updatedResults[2].percent)
    : 0;
  const totalAreometerSum = areometerOne + areometerTwo + areometerThree;
  const totalSievesSum = f1_05_val + f05_025_val + f025_01_val;
  const totalSums = totalSievesSum + totalAreometerSum;

  const fLess1Calculated = (100 - totalSums).toFixed(2);

  // 3. Собираем все данные в единый объект для шаблона
  const data = {
    sampleId: sampleId || "—",
    depth: depth || "—",
    soilWeight,
    testDate: testDate || "—",
    mineNumber: mineNumber || "—",
    projectNumber: projectNumber || "—", // Добавляем номер проекта в объект данных
    // Проценты сухого сита
    f10_p: sieveDryPercents.f10 || "0.00",
    f10_5_p: sieveDryPercents.f10_5 || "0.00",
    f5_2_p: sieveDryPercents.f5_2 || "0.00",
    f2_1_p: sieveDryPercents.f2_1 || "0.00",

    // Проценты сит с промывкой (формула 4.3.4.3)
    f1_05_p: sieveWashPercents.f1_05 || "0.00",
    f05_025_p: sieveWashPercents.f05_025 || "0.00",
    f025_01_p: sieveWashPercents.f025_01 || "0.00",
    fLess1_p: fLess1Calculated || "0.00",

    measurements: updatedResults,
  };

  const allPercentages = [
    parseFloat(data.f10_p) || 0,
    parseFloat(data.f10_5_p) || 0,
    parseFloat(data.f5_2_p) || 0,
    parseFloat(data.f2_1_p) || 0,
    parseFloat(data.f1_05_p) || 0,
    parseFloat(data.f05_025_p) || 0,
    parseFloat(data.f025_01_p) || 0,
    parseFloat(data.fLess1_p) || 0,
    ...data.measurements.map((m) => parseFloat(m.percent) || 0),
  ];

  // Считаем общую сумму и округляем до 2 знаков
  const totalSum = allPercentages.reduce((acc, val) => acc + val, 0).toFixed(2);

  // 4. Создаем документ Word с ОДНОЙ общей таблицей
  // 4. Создаем документ Word с ОДНОЙ общей таблицей
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 28, // 28 полупунктов = 14pt для всего документа
          },
        },
      },
    },
    sections: [
      {
        // Переносим нижний блок в колонтитул (footer), чтобы он всегда был в самом низу страницы
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "none", size: 0, color: "auto" },
                  bottom: { style: "none", size: 0, color: "auto" },
                  left: { style: "none", size: 0, color: "auto" },
                  right: { style: "none", size: 0, color: "auto" },
                  insideHorizontal: { style: "none", size: 0, color: "auto" },
                  insideVertical: { style: "none", size: 0, color: "auto" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        children: [
                          // Первая строка: Название по центру крупным шрифтом
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "ГРАНУЛОМЕТРИЧЕСКИЙ СОСТАВ",
                                bold: true,
                                size: 30, // 16pt
                              }),
                            ],
                            spacing: { after: 120 }, // небольшой отступ перед номером проекта
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "АРЕОМЕТРИЧЕСКИМ МЕТОДОМ",
                                bold: true,
                                size: 30, // 16pt
                              }),
                            ],
                            spacing: { after: 120 }, // небольшой отступ перед номером проекта
                          }),
                          // Вторая строка: Номер проекта под названием (можно тоже по центру или слева)
                          new Paragraph({
                            alignment: AlignmentType.LEFT, // или AlignmentType.LEFT, если хотите прижать к левому краю
                            children: [
                              new TextRun({
                                text: `Проект №: ${data.projectNumber || "—"}`,
                                size: 24, // 12pt
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Шапка документа с отступом сверху
          new Paragraph({
            children: [
              new TextRun({ text: "Лабораторный номер образца: ", bold: true }),
              new TextRun({ text: `${data.sampleId}` }),
            ],
            spacing: {
              before: 1300, // Отступ сверху от края страницы
            },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Номер выработки: ", bold: true }),
              new TextRun({ text: `${data.mineNumber || "—"}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Глубина отбора, м: ", bold: true }),
              new TextRun({ text: `${data.depth}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Дата испытания: ", bold: true }),
              new TextRun({ text: `${data.testDate || "—"}` }),
            ],
            spacing: { after: 300 }, // Отступ после всей шапки перед таблицей
          }),

          // ЕДИНАЯ ОБЩАЯ ТАБЛИЦА
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Шапка таблицы
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Фракция", bold: true }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Содержание (%)", bold: true }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // Секция 1: Сухой ситовый анализ
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Более 10 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f10_p} %`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("10 - 5 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f10_5_p} %`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("5 - 2 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f5_2_p} %`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("2 - 1 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f2_1_p} %`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("1 - 0.5 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f1_05_p} %`)],
                  }),
                ],
              }),

              // Секция 2: Ситовый анализ с промывкой
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("0.5 - 0.25 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f05_025_p} %`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("0.25 - 0.1 мм")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.f025_01_p} %`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("0.1 - 0.05 мм ")],
                  }),
                  new TableCell({
                    children: [new Paragraph(`${data.fLess1_p} %`)],
                  }),
                ],
              }),

              // Секция 3: Ареометр (динамические замеры)
              ...data.measurements.map((m, index) => {
                let fractionLabel = "Ареометр";
                if (index === 0) fractionLabel = "0.05 - 0.002 мм";
                else if (index === 1) fractionLabel = "0.002 - 0.0002 мм";
                else if (index === 2) fractionLabel = "< 0.002 мм";

                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(fractionLabel)] }),
                    new TableCell({
                      children: [new Paragraph(`${m.percent} %`)],
                    }),
                  ],
                });
              }),

              // ИТОГОВАЯ СТРОКА ТАБЛИЦЫ
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Общая сумма", bold: true }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `${totalSum} %`, bold: true }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Кривая гранулометрического состава",
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 300, before: 200 },
          }),
          // Важно использовать оператор развертывания массива (...)
          ...(await generateGraphSection(data)),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer.toString("base64");
}
