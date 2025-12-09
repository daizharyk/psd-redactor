"use client";

import { useState } from "react";
import { translatePlasticityText } from "../utils/translatePlasticityText";
import mammoth from "mammoth";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import Styles from "./page.module.css";
import GoBack from "@/button/goBack";
// Функция перевода для графиков пластичности

export default function PlasticityTranslator() {
  const [fileName, setFileName] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setTranslatedText("");
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const handleTranslate = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;

      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      let preview = "";
      doc.body.childNodes.forEach((node) => {
        if (node.nodeName === "P") {
          const text = node.textContent || "";
          preview += translatePlasticityText(text) + "\n";
        } else if (node.nodeName === "TABLE") {
          node.querySelectorAll("tr").forEach((tr) => {
            const cells = [];
            tr.querySelectorAll("td, th").forEach((cell) => {
              const cellText = cell.textContent.trim() || "";
              cells.push(translatePlasticityText(cellText));
            });
            if (cells.length > 0) {
              preview += cells.join(" | ") + "\n";
            }
          });
          preview += "\n";
        }
      });

      setTranslatedText(preview);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownload = () => {
    if (!translatedText) return;

    const lines = translatedText
      .split("\n")
      .filter((line) => line.trim() !== "");

    const doc = new Document({
      sections: [
        {
          children: lines.map((line) => {
            // определяем, нужно ли центрировать текст
            const isCenterText =
              line.includes("ГРАФИК ПЛАСТИЧНОСТИ") ||
              line.includes(
                "Геотехнические изыскания на морских объектах, Проект Кашаган, Фаза IIA"
              ) ||
              line.includes("PLASTICITY CHART") ||
              line.includes(
                "Offshore Geotechnical Investigation Kashagan Phase IIA Project"
              );
            const isBefore100 = line.includes("Влаж. масса.");
            const paddingBefore300 =
              line.includes("Проект") || line.includes("Project");

            const cleanLine = line.replace(/\s+/g, " ");

            const paddingBefore200 = cleanLine.includes("Среднее значение");

            const paddingAfter100 =
              line.includes(
                "Геотехнические изыскания на морских объектах, Проект Кашаган, Фаза IIA"
              ) ||
              line.includes(
                "Offshore Geotechnical Investigation Kashagan Phase IIA Project"
              );

            const paddingAfter1000 =
              line.includes(
                "Предел текучести     (грамм)     (грамм)     (%)      (N)      (N=25)"
              ) ||
              line.includes(
                "Предел пластичности    (грамм)     (грамм)     (%)"
              );

            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  font: "Courier New",
                  size: 16,
                }),
              ],
              alignment: isCenterText
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
              spacing: {
                ...(paddingAfter100 && { after: 300 }),
                ...(paddingAfter1000 && { after: 100 }),
                ...(isBefore100 && { before: 200 }),
                ...(paddingBefore300 && { before: 300 }),
                ...(paddingBefore200 && { before: 200 }),
              },
            });
          }),
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      const newFileName = fileName
        ? fileName.replace(/\.[^/.]+$/, "") + ".docx"
        : "translated_RUS.docx";
      saveAs(blob, newFileName);
    });
  };

  return (
    <div
      className={Styles.main}
      style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <GoBack />

      <h1 style={{ color: "#2c3e50", marginBottom: "30px" }}>
        Переводчик графиков пластичности (ENG → RUS)
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="file-upload" className={Styles.fileUploadLabel}>
          📁 Выбрать файл DOCX
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".doc,.docx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {fileName && (
          <span
            style={{
              marginLeft: "30px",
              color: "#ffffffff",
              fontWeight: "bold",
              fontSize: "20px",
            }}
          >
            ✓ {fileName}
          </span>
        )}
      </div>

      <button
        onClick={handleTranslate}
        disabled={!file}
        style={{
          padding: "12px 30px",
          backgroundColor: file ? "#27ae60" : "#95a5a6",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: file ? "pointer" : "not-allowed",
          marginRight: "10px",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) =>
          file && (e.target.style.backgroundColor = "#229954")
        }
        onMouseLeave={(e) =>
          file && (e.target.style.backgroundColor = "#27ae60")
        }
      >
        🔄 Перевести
      </button>

      {translatedText && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#ecf0f1",
            borderRadius: "8px",
            border: "2px solid #bdc3c7",
          }}
        >
          <h3 style={{ color: "#ffffffff", marginBottom: "15px" }}>
            📄 Перевод:
          </h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "Courier New, monospace",
              fontSize: "13px",
              lineHeight: "1.6",
              maxHeight: "500px",
              overflow: "auto",
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            {translatedText}
          </pre>
        </div>
      )}
      {translatedText && (
        <button className={Styles.download} onClick={handleDownload}>
          💾 Скачать DOCX
        </button>
      )}
    </div>
  );
}
