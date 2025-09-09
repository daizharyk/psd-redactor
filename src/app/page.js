"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  Packer,
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import mammoth from "mammoth";
import { processText } from "./utils/textProcessor";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
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

    if (file.name.endsWith(".docx")) {
      reader.onload = async (e) => {
        try {
          const { value } = await mammoth.extractRawText({
            arrayBuffer: e.target.result,
          });
          const cleanText = value.replace(
            /[^\x20-\x7E\u0400-\u04FF\n\r\t]/g,
            ""
          );

          // потом обрабатываем твоей функцией
          const processed = processText(cleanText);

          setFileContent(processed);
        } catch (err) {
          setFileContent("Ошибка при обработке Word файла");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const rawText = e.target.result;
        const cleanText = rawText.replace(
          /[^\x20-\x7E\u0400-\u04FF\n\r\t]/g,
          ""
        );

        // потом обрабатываем твоей функцией
        const processed = processText(cleanText);
        setFileContent(processed);
      };
      reader.readAsText(file, "utf-8");
    }
  };

  const handleDownload = async () => {
    if (!fileContent) return;

    // чистим текст от мусора
    const cleanText = fileContent.replace(
      /[^\x20-\x7E\u0400-\u04FF\n\r\t]/g,
      ""
    );

    const paragraphs = [];
    const lines = cleanText.split(/\r?\n/);

    // заголовки для табличных блоков
    const tableHeaders = [
      "Time (sec):",
      "Reading",
      "Diameter",
      "Grams",
      "Percentage",
    ];
    let currentTable = null;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // === 1. Проверяем "PARTICLE SIZE DISTRIBUTION" ===
      if (/^PARTICLE SIZE DISTRIBUTION\s*$/i.test(trimmed)) {
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

        // ищем проектное имя
        let projectName = "";
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            projectName = lines[j].trim();
            i = j; // чтобы не продублировать
            break;
          }
        }

        if (projectName) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: projectName,
                  font: "Courier New",
                  size: 16,
                }),
              ],
            })
          );
        }

        continue; // переходим к следующей строке
      }

      // === 2. Проверяем строки для таблиц ===
      const header = tableHeaders.find((h) => trimmed.startsWith(h));
      if (header) {
        const parts = trimmed.split(/\s+/);
        const label = parts.shift(); // например, "Time"
        let maybeColon = "";
        if (parts[0] && parts[0].endsWith(":")) {
          maybeColon = parts.shift(); // например, "(sec):"
        }

        const numbers = parts;

        // создаём ряд таблицы
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

        // если таблица уже идёт — добавляем строку
        if (currentTable) {
          currentTable.tableRows.push(row);
        } else {
          // создаём новую таблицу
          currentTable = { type: "table", tableRows: [row] };
          paragraphs.push(currentTable);
        }
        continue;
      }

      // === 3. Если строка обычная ===
      if (currentTable) {
        // закрываем таблицу, если встретили не табличную строку
        currentTable = null;
      }

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: lines[i], // оставляем как есть, чтобы пробелы сохранились
              font: "Courier New",
              size: 16,
            }),
          ],
          alignment: AlignmentType.LEFT,
        })
      );
    }

    // превращаем "виртуальные" таблицы в docx.Table
    const docChildren = paragraphs.map((p) => {
      if (p.type === "table") {
        return new Table({
          width: { size: 108, type: WidthType.PERCENTAGE },
          rows: p.tableRows,
        });
      }
      return p;
    });

    const doc = new Document({
      sections: [
        {
          children: docChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, (fileName?.replace(/\.[^.]+$/, "") || "result") + ".docx");
  };
  // отфильтруем дубли
  const uniqueStations = stations.filter(
    (station, index, self) =>
      index === self.findIndex((s) => s.url_resolved === station.url_resolved)
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.radio}>
          <h2 className={styles.h2}>Radio</h2>
          <div
            onClick={() => handlePlayPause(station.url_resolved)}
            className={styles.radioContainer}
          >
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
