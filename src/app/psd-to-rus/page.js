"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { saveAs } from "file-saver";
import { translatePsdText } from "../utils/translatePsdText";
import GoBack from "@/button/goBack";
import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";

export default function PsdToRus() {
  const [fileName, setFileName] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [file, setFile] = useState(null);
  const [docStructure, setDocStructure] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setTranslatedText("");
    setFile(selectedFile);
    setDocStructure(null);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const handleTranslate = async () => {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();

    // Получаем HTML с сохранением структуры
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    // Парсим HTML и извлекаем структуру
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const structure = parseDocumentStructure(doc.body);
    setDocStructure(structure);

    // Показываем превью перевода
    const preview = structure
      .map((item) => {
        if (item.type === "paragraph") {
          return item.translatedText;
        } else if (item.type === "table") {
          return item.rows
            .map((row) => row.translatedCells.join(" | "))
            .join("\n");
        }
        return "";
      })
      .join("\n\n");

    setTranslatedText(preview);
  };

  const parseDocumentStructure = (body) => {
    const structure = [];

    body.childNodes.forEach((node) => {
      if (node.nodeName === "P") {
        const text = node.textContent || "";
        structure.push({
          type: "paragraph",
          text: text,
          translatedText: translatePsdText(text),
        });
      } else if (node.nodeName === "TABLE") {
        const allRows = [];
        node.querySelectorAll("tr").forEach((tr) => {
          const cells = [];
          const translatedCells = [];
          tr.querySelectorAll("td, th").forEach((cell) => {
            const cellText = cell.textContent.trim() || "";
            cells.push(cellText);
            translatedCells.push(translatePsdText(cellText));
          });
          if (cells.length > 0) {
            allRows.push({ cells, translatedCells });
          }
        });

        // Разделяем таблицы по ПЕРЕВЕДЕННЫМ заголовкам
        const tableGroups = splitTablesByHeaders(allRows);
        tableGroups.forEach((rows) => {
          structure.push({
            type: "table",
            rows,
          });
        });
      }
    });

    return structure;
  };

  const splitTablesByHeaders = (rows) => {
    console.log("🔍 Начинаем разделение таблиц, всего строк:", rows.length);

    const tables = [];
    let currentTable = [];
    let lastSeenHeader = null;

    rows.forEach((row, index) => {
      const firstCellOriginal = row.cells[0] || "";
      const firstCellTranslated = row.translatedCells[0] || "";

      console.log(
        `Строка ${index}: "${firstCellOriginal}" → "${firstCellTranslated}"`
      );

      const isFirstTableHeader =
        firstCellOriginal.toLowerCase().includes("diameter") ||
        firstCellOriginal.toLowerCase().includes("grams") ||
        firstCellOriginal.toLowerCase().includes("percentage") ||
        firstCellTranslated.includes("Диаметр") ||
        firstCellTranslated.includes("грамм") ||
        firstCellTranslated.includes("Процент");

      const isSecondTableHeader =
        firstCellOriginal.toLowerCase().includes("time") ||
        firstCellTranslated.includes("Время");

      const isSummaryTableHeader =
        firstCellOriginal.includes("M2000") ||
        firstCellOriginal.includes("M63") ||
        firstCellOriginal.includes("Dm") ||
        firstCellOriginal.toLowerCase().includes("sand fraction") ||
        firstCellTranslated.includes("M2000") ||
        firstCellTranslated.includes("M63") ||
        firstCellTranslated.includes("Dm") ||
        firstCellTranslated.includes("Фракция песка");

      if (isSecondTableHeader && currentTable.length > 0) {
        tables.push([...currentTable]);
        currentTable = [];
        lastSeenHeader = "time";
      } else if (isSummaryTableHeader && currentTable.length > 0) {
        tables.push([...currentTable]);
        currentTable = [];
        lastSeenHeader = "summary";
      } else if (
        isFirstTableHeader &&
        lastSeenHeader === "summary" &&
        currentTable.length > 0
      ) {
        tables.push([...currentTable]);
        currentTable = [];
        lastSeenHeader = "diameter";
      }

      if (isFirstTableHeader) {
        lastSeenHeader = "diameter";
      } else if (isSecondTableHeader) {
        lastSeenHeader = "time";
      } else if (isSummaryTableHeader) {
        lastSeenHeader = "summary";
      }

      currentTable.push(row);
    });

    if (currentTable.length > 0) {
      tables.push(currentTable);
    }

    return tables.length > 0 ? tables : [rows];
  };

  function isLine(item, originals = [], translations = []) {
    const text = item.text?.toLowerCase() || "";
    const translated = item.translatedText || "";

    return (
      originals.some((o) => text.startsWith(o.toLowerCase())) ||
      translations.some((t) => translated.startsWith(t))
    );
  }

  const handleDownload = async () => {
    if (!docStructure) return;

    const docElements = [];

    docStructure.forEach((item) => {
      if (item.type === "paragraph") {
        console.log("item", item.text);
        const isCenterText =
          item.text.includes("Определение размеров частиц") ||
          item.text.includes("ГЕОТЕХНИЧЕСКИЕ ИЗЫСКАНИЯ НА МОРСКИХ ОБЪЕКТАХ") ||
          item.text.includes("PARTICLE SIZE DISTRIBUTION") ||
          item.text.includes(
            "Offshore Geotechnical Investigation Kashagan Phase IIA Project"
          );

        const isProjectLine =
          item.text.toLowerCase().startsWith("project") ||
          item.translatedText.startsWith("Проект");

        const isProjectLine100 = isLine(
          item,
          [
            "Sample mass (g)",
            "Sand fraction",
            "Particle Size Distribution",
            "PARTICLE SIZE DISTRIBUTION",
          ],
          ["Масса образца (г)", "Фракция песка", "Определение размеров частиц"]
        );

        const isProjectLine100before = isLine(
          item,
          ["Sand fraction"], // оригинал
          ["Фракция песка"] // перевод
        );

        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.translatedText || " ",
                font: "Courier New",
                size: 16,
              }),
            ],
            alignment: isCenterText ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: {
              ...(isProjectLine && { before: 400 }),
              ...(isProjectLine100 && { after: 100 }),
              ...(isProjectLine100before && { before: 100 }),
            },
          })
        );
      } else if (item.type === "table") {
        const tableRows = item.rows.map((row) => {
          const cells = row.translatedCells.map((cellText) => {
            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText || " ",
                      font: "Courier New",
                      size: 16,
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              width: {
                size: 100 / row.translatedCells.length,
                type: WidthType.PERCENTAGE,
              },
            });
          });

          return new TableRow({
            children: cells,
          });
        });
        docElements.push(
          new Table({
            rows: tableRows,
            width: {
              size: 108,
              type: WidthType.PERCENTAGE,
            },
          })
        );
        docElements.push(
          new Paragraph({
            spacing: { before: 100, after: 100 }, // 200–300 норм
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          children: docElements,
        },
      ],
    });

    const newFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, "") + ".docx"
      : "translated_RUS.docx";

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, newFileName);
    } catch (err) {
      console.error("Ошибка при генерации DOCX:", err);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <GoBack />

        <div className={styles.description}>
          <div className={styles.title}>PSD-to-Russian</div>
          <div className={styles.uploadSection}>
            <input type="file" id="file" onChange={handleFileChange} />
            <label htmlFor="file">Upload file</label>
            <button className={styles.translateBtn} onClick={handleTranslate}>
              Translate
            </button>
          </div>

          {fileName && <p className={styles.fileName}>📄 {fileName}</p>}

          <div className={styles.resultSection}>
            <div className={styles.resultBox}>
              {translatedText || "...translated content will appear here..."}
            </div>

            <button className={styles.downloadBtn} onClick={handleDownload}>
              Download RUS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
