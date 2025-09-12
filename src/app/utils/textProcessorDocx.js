import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  Packer,
} from "docx";

export function buildDocx(text) {
  if (!text) return null;

  const blockRegex =
    /Made By[\s\S]*?Approved by senior labora[\s\S]*?------------------/g;
  const matches = [...text.matchAll(blockRegex)];

  let finalMadeByBlock = [];
  if (matches.length > 0) {
    const lastBlock = matches[matches.length - 1][0];
    finalMadeByBlock = lastBlock.split(/\r?\n/).filter((line) => line !== "");

    // Удаляем все блоки из текста
    text = text.replace(blockRegex, "").trim();
  }

  let paragraphs = [];
  let lines = text.split(/\r?\n/);

  let firstProjectName = "";
  let hasAddedPSD = false;
  let currentTable = null;

  const tableHeaders = [
    "Time (sec):",
    "Reading",
    "Diameter",
    "Grams",
    "Percentage",
  ];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // === 1. Заголовок PSD ===
    if (/^PARTICLE SIZE DISTRIBUTION\s*$/i.test(trimmed)) {
      if (!hasAddedPSD) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "PARTICLE SIZE DISTRIBUTION",
                font: "Courier New",
                size: 16,
              }),
            ],
          })
        );

        // сразу добавляем строку с project name
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine) {
            firstProjectName = nextLine;
            paragraphs.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: firstProjectName,
                    font: "Courier New",
                    size: 16,
                  }),
                ],
              })
            );
            i = j;
            break;
          }
        }

        hasAddedPSD = true;
      }
      continue;
    }

    // не дублируем project name
    if (firstProjectName && trimmed === firstProjectName) {
      continue;
    }

    // === 3. Убираем лишние пустые строки (не больше 2 подряд) ===
    let newLines = [];
    let emptyCount = 0;
    for (let line of lines) {
      if (line.trim() === "") {
        emptyCount++;
        if (emptyCount <= 2) {
          newLines.push(line);
        }
      } else {
        emptyCount = 0;
        newLines.push(line);
      }
    }
    lines = newLines;

    // === 4. Таблицы ===
    const header = tableHeaders.find((h) => trimmed.startsWith(h));
    if (header) {
      const parts = trimmed.split(/\s+/);
      const label = parts.shift();
      let maybeColon = "";
      if (parts[0] && parts[0].endsWith(":")) {
        maybeColon = parts.shift();
      }
      const numbers = parts;

      const row = new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label + (maybeColon ? " " + maybeColon : ""),
                    font: "Courier New",
                    size: 16,
                  }),
                ],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          ...numbers.map(
            (num) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: num,
                        font: "Courier New",
                        size: 16,
                      }),
                    ],
                  }),
                ],
                width: {
                  size: 85 / numbers.length,
                  type: WidthType.PERCENTAGE,
                },
              })
          ),
        ],
      });

      if (currentTable) {
        currentTable.tableRows.push(row);
      } else {
        currentTable = { type: "table", tableRows: [row] };
        paragraphs.push(currentTable);
      }
      continue;
    }

    // === 5. Закрываем таблицу ===
    if (currentTable) {
      currentTable = null;
    }

    // === 6. Обычный текст ===
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: lines[i],
            font: "Courier New",
            size: 16,
          }),
        ],
        alignment: AlignmentType.LEFT,
      })
    );
  }

  // === 7. Добавляем блок Made By в конце ===
  if (finalMadeByBlock.length > 0) {
    // Добавляем 4 пустых строки как отступ
    for (let i = 0; i < 4; i++) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: " ", font: "Courier New", size: 16 })],
          alignment: AlignmentType.LEFT,
        })
      );
    }

    finalMadeByBlock.forEach((line) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Courier New",
              size: 16,
            }),
          ],
          alignment: AlignmentType.LEFT,
        })
      );
    });
  }

  // === 8. Превращаем виртуальные таблицы ===
  const docChildren = paragraphs.map((p) => {
    if (p.type === "table") {
      return new Table({
        width: { size: 108, type: WidthType.PERCENTAGE },
        rows: p.tableRows,
      });
    }
    return p;
  });

  // === 9. Документ ===
  const doc = new Document({
    sections: [
      {
        children: docChildren,
      },
    ],
  });

  // === 10. Номер скважины ===
  let boreholeNumber = "";
  const boreholeMatch = text.match(/Borehole\s*:\s*B\w*-?(\d+)/i);
  if (boreholeMatch) {
    boreholeNumber = boreholeMatch[1];
  }

  return { doc, boreholeNumber };
}
