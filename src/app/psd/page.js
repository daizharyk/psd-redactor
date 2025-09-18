"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { Packer } from "docx";
import { saveAs } from "file-saver";

import { processText } from "../utils/textProcessor";
import { buildDocx } from "../utils/textProcessorDocx";

import GoBack from "@/button/goBack";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [docData, setDocData] = useState(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileContent(""); // сразу обнуляем старое содержимое
    setFile(selectedFile); // сохраняем новый файл
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const handleProcessFile = async () => {
    const fileInput = document.getElementById("file");
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const rawText = e.target.result;

      const cleanText = rawText.replace(/[^\x20-\x7E\u0400-\u04FF\n\r\t]/g, "");

      const processed = processText(cleanText);

      const result = buildDocx(processed);

      setFileContent(processed);
      setDocData(result);
    };

    reader.readAsText(file, "utf-8");
  };

  const handleDownload = async () => {
    if (!docData) return;

    const { doc, boreholeNumber } = docData;

    const newFileName = boreholeNumber
      ? `BH-${boreholeNumber}_PSD.docx`
      : "result_PSD.docx";

    const blob = await Packer.toBlob(doc);
    saveAs(blob, newFileName);
  };
  // отфильтруем дубли

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <GoBack />

        <div className={styles.description}>
          <div className={styles.title}>PSD-redactor</div>
          <div className={styles.uploadSection}>
            <input type="file" id="file" onChange={handleFileChange} />
            <label htmlFor="file">Upload file</label>
            <button onClick={handleProcessFile}>Process PSD</button>
          </div>

          {fileName && <p className={styles.fileName}>📄 {fileName}</p>}

          <div className={styles.resultSection}>
            <div className={styles.resultBox}>
              {fileContent || "...processed content will appear here..."}
            </div>

            <button className={styles.downloadBtn} onClick={handleDownload}>
              Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
