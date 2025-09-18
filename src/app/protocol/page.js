"use client";

import GoBack from "@/button/goBack";
import styles from "./page.module.css";
import { useState } from "react";

const Page = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");



  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFileName(e.target.files[0] ? e.target.files[0].name : "");
  };

  const handleProcess = async () => {
    if (!file) return alert("Сначала выберите файл");

    const formData = new FormData();
    formData.append("file", file); // ✅ добавляем файл

    setLoading(true);
    try {
      const res = await fetch("/api/protocol", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Ошибка: " + err.error);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // скачивание
      const a = document.createElement("a");
      a.href = url;
      a.download = "protocol.pdf";
      a.click();
    } catch (err) {
      console.error("Ошибка при обработке:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.main}>
      <GoBack />
      <div className={styles.container}>
        <h1>Create a protocol</h1>
        <label className={styles.customButton}>
          {fileName ? fileName : "Выбери PDF"}
          <input
            onChange={handleFileChange}
            type="file"
            accept="application/pdf"
            className={styles.fileInput}
          />
        </label>

        <button
          className={styles.button}
          onClick={handleProcess}
          disabled={!file || loading}
        >
          {loading ? "Processing..." : "Обработать"}
        </button>
      </div>
    </div>
  );
};

export default Page;
