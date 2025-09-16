"use client";

import GoBack from "@/button/goBack";
import styles from "./page.module.css";
import { useState } from "react";

const Page = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return alert("Сначала выберите файл");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    const res = await fetch("/api/protocol", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    // скачивание
    const a = document.createElement("a");
    a.href = url;
    a.download = "protocol.pdf";
    a.click();
    setLoading(false);
  };

  return (
    <div className={styles.main}>
      <GoBack />
      <div className={styles.container}>
        <h1>Create a protocol</h1>
        <input
          onChange={handleFileChange}
          type="file"
          accept="application/pdf"
        />
        <button onClick={handleProcess} disabled={!file || loading}>
          {loading ? "Processing..." : "Обработать"}
        </button>
      </div>
    </div>
  );
};

export default Page;
