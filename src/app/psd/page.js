"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { Packer } from "docx";
import { saveAs } from "file-saver";

import { processText } from "../utils/textProcessor";
import { buildDocx } from "../utils/textProcessorDocx";
import Link from "next/link";
import GoBack from "@/button/goBack";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [docData, setDocData] = useState(null);
  const [file, setFile] = useState(null);
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePlayPause = (stationUrl) => {
    const audio = audioRef.current;

    if (!audio) return;

    if (currentStation === stationUrl && isPlaying) {
      // Если нажали на текущую станцию, которая играет — пауза
      audio.pause();
      setIsPlaying(false);
    } else {
      // Если новая станция или радио не играет — запускаем
      setCurrentStation(stationUrl);
      audio.src = stationUrl;
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileContent(""); // сразу обнуляем старое содержимое
    setFile(selectedFile); // сохраняем новый файл
    setFileName(selectedFile ? selectedFile.name : "");
  };

  useEffect(() => {
    fetch(
      "https://de1.api.radio-browser.info/json/stations/bycountry/Kazakhstan?limit=50"
    )
      .then((res) => res.json())
      .then((data) => {
        // фильтруем только станции с рабочим URL потока
        const filtered = data.filter((station) => station.url_resolved);
        setStations(filtered);
      })
      .catch((err) => console.error("Radio API error:", err));
  }, []);

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
  const uniqueStations = stations.filter(
    (station, index, self) =>
      index === self.findIndex((s) => s.url_resolved === station.url_resolved)
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <GoBack />
        <div className={styles.radio}>
          <h2 className={styles.h2}>Radio</h2>
          <div className={styles.radioContainer}>
            {uniqueStations.map((station) => (
              <div
                onClick={() => handlePlayPause(station.url_resolved)}
                key={station.stationuuid}
                className={styles.radioItem}
              >
                <img
                  src={station.favicon || "/default-radio.webp"}
                  alt={station.name}
                  className={styles.radioLogo}
                  onError={(e) => (e.target.src = "/default-radio.webp")}
                />
                <span className={styles.radioName}>{station.name}</span>
                <button
                  className={styles.radioBtn}
                  onClick={() => handlePlayPause(station.url_resolved)}
                >
                  {currentStation === station.url_resolved && isPlaying
                    ? "⏸️"
                    : "▶️"}
                </button>
              </div>
            ))}

            <audio ref={audioRef} style={{ display: "none" }} />
          </div>
        </div>

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
