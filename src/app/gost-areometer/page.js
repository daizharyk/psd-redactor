"use client";
import { useState } from "react";
import { generateReport } from "./actions";
import Styles from "./page.module.css";
import GoBack from "@/button/goBack";

export default function AreometerPage() {
  const [sampleId, setSampleId] = useState("");
  const [depth, setDepth] = useState("");

  // Добавленные состояния для новых полей
  const [hygroscopic, setHygroscopic] = useState("");
  const [dryHumidity, setDryHumidity] = useState("30"); // проба воздушно-сухой влажности
  const [soilWeight, setSoilWeight] = useState("50"); // по умолчанию 50 г

  const [mineNumber, setMineNumber] = useState(""); // Номер выработки

  const [testDate, setTestDate] = useState(""); // Дата испытания

  // 1. Ситовый анализ (сухой) - 6 фракций
  const [sieveDry, setSieveDry] = useState({
    f10: "0",
    f10_5: "0",
    f5_2: "0",
    f2_1: "0",
  });
  // 2. Ситовый анализ с промывкой водой - 3 фракции
  const [sieveWash, setSieveWash] = useState({
    f1_05: "", // 1 - 0.5 мм
    f05_025: "", // 0.5 - 0.25 мм
    f025_01: "", // 0.25 - 0.1 мм
  });

  // 3. Окончательный отсчет по ареометру - 3 интервала
  const [measurements, setMeasurements] = useState([
    { time: "1 минута", value: "" },
    { time: "30 минут", value: "" },
    { time: "11 часов", value: "" },
  ]);

  const [projectNumber, setProjectNumber] = useState(""); // Номер проекта
  const handleSieveDryChange = (field, value) => {
    setSieveDry({ ...sieveDry, [field]: value });
  };

  const handleSieveWashChange = (field, value) => {
    setSieveWash({ ...sieveWash, [field]: value });
  };

  const handleValueChange = (index, value) => {
    const newMeasurements = [...measurements];
    newMeasurements[index].value = value;
    setMeasurements(newMeasurements);
  };

  const handleDownload = async () => {
    const base64 = await generateReport({
      projectNumber,
      sampleId,
      mineNumber,
      depth,
      testDate,
      hygroscopic, // передаем гигроскопическую влажность
      soilWeight, // передаем вес пробы
      sieveDry,
      sieveWash,
      dryHumidity,
      measurements,
    });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
    link.download = `Отчет_${sampleId || "areometer"}.docx`;
    link.click();
  };

  // Внутри вашего компонента page.js:
  const [errors, setErrors] = useState({});

  const handleDownloadClick = async () => {
    const newErrors = {};

    // Проверяем ситовый анализ с промывкой
    if (!sieveWash.f1_05 || sieveWash.f1_05.toString().trim() === "") {
      newErrors.f1_05 = "Заполните это поле";
    }
    if (!sieveWash.f05_025 || sieveWash.f05_025.toString().trim() === "") {
      newErrors.f05_025 = "Заполните это поле";
    }
    if (!sieveWash.f025_01 || sieveWash.f025_01.toString().trim() === "") {
      newErrors.f025_01 = "Заполните это поле";
    }

    // Проверяем измерения ареометра
    measurements.forEach((m, i) => {
      if (!m.value || m.value.toString().trim() === "") {
        newErrors[`measurement_${i}`] = "Заполните это поле";
      }
    });

    // Записываем ошибки в стейт
    setErrors(newErrors);

    // Если есть хоть одна ошибка, прерываем выполнение
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Если всё заполнено, вызываем вашу функцию генерации отчета
    await handleDownload();
  };

  return (
    <div className={Styles.container}>
      <GoBack />
      <div className={Styles.wrapper}>
        <h1 className={Styles.h1}>Ареометрический метод (ГОСТ 12536)</h1>

        <div className={Styles.inputContainer}>
          <label>Номер образца:</label>
          <input
            placeholder="Номер образца"
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
          />
        </div>

        {/* Новое поле: Номер выработки */}

        <div className={Styles.inputContainer}>
          <label>Проект №:</label>
          <input
            placeholder="Номер выработки"
            value={projectNumber}
            onChange={(e) => setProjectNumber(e.target.value)}
          />
        </div>
        <div className={Styles.inputContainer}>
          <label>Номер выработки:</label>
          <input
            placeholder="Номер выработки"
            value={mineNumber}
            onChange={(e) => setMineNumber(e.target.value)}
          />
        </div>
        <div className={Styles.inputContainer}>
          <label>Глубина:</label>
          <input
            placeholder="Глубина (м)"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
          />
        </div>

        {/* Новое поле: Дата испытания */}
        <div className={Styles.inputContainer}>
          <label>Дата испытания:</label>
          <input
            type="date" // Удобно использовать выбор даты, либо оставить text, если нужен формат строку
            placeholder="Дата испытания"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
          />
        </div>

        {/* Гигроскопическая влажность (произвольное значение) */}
        <div className={Styles.inputContainer}>
          <label>Гигроскопическая влажность (%):</label>
          <input
            type="number"
            step="0.01"
            placeholder="Введите значение"
            value={hygroscopic}
            onChange={(e) => setHygroscopic(e.target.value)}
          />
        </div>
        <div className={Styles.inputContainer}>
          <label>Проба воздушно-сухой влажности (г):</label>
          <input
            type="number"
            step="0.01"
            placeholder="Введите значение"
            value={dryHumidity}
            onChange={(e) => setDryHumidity(e.target.value)}
          />
        </div>

        {/* Выбор веса пробы грунта (50 или 100 г) */}
        <div className={Styles.inputContainer}>
          <label>Вес пробы грунта (г):</label>
          <select
            className={Styles.select}
            value={soilWeight}
            onChange={(e) => setSoilWeight(e.target.value)}
          >
            <option value="50">50 г</option>
            <option value="100">100 г</option>
          </select>
        </div>

        {/* Секция 1: Ситовый анализ (сухой) */}
        <h3 className={Styles.sectionTitle}>1. Ситовый анализ (сухой)</h3>
        <div className={Styles.inputContainer}>
          <label>Более 10 мм:</label>
          <input
            type="number"
            value={sieveDry.f10 ?? "0"}
            onChange={(e) => handleSieveDryChange("f10", e.target.value)}
          />
        </div>
        <div className={Styles.inputContainer}>
          <label>10 - 5 мм:</label>
          <input
            type="number"
            value={sieveDry.f10_5 ?? "0"}
            onChange={(e) => handleSieveDryChange("f10_5", e.target.value)}
          />
        </div>
        <div className={Styles.inputContainer}>
          <label>5 - 2 мм:</label>
          <input
            type="number"
            value={sieveDry.f5_2 ?? "0"}
            onChange={(e) => handleSieveDryChange("f5_2", e.target.value)}
          />
        </div>
        <div className={Styles.inputContainer}>
          <label>2 - 1 мм:</label>
          <input
            type="number"
            value={sieveDry.f2_1 ?? "0"}
            onChange={(e) => handleSieveDryChange("f2_1", e.target.value)}
          />
        </div>

        {/* Секция 2: Ситовый анализ с промывкой водой */}
        <h3 className={Styles.sectionTitle}>
          2. Ситовый анализ с промывкой водой
        </h3>

        <div className={Styles.inputContainer}>
          <label>1 - 0.5 мм:</label>
          <div className={Styles.inputWrapper}>
            <input
              type="number"
              value={sieveWash.f1_05 ?? ""}
              className={errors.f1_05 ? Styles.inputError : ""}
              onChange={(e) => {
                handleSieveWashChange("f1_05", e.target.value);
                // Убираем ошибку при начале ввода
                if (errors.f1_05) setErrors({ ...errors, f1_05: null });
              }}
              placeholder="Введите значение"
            />
            {errors.f1_05 && (
              <span className={Styles.errorText}>{errors.f1_05}</span>
            )}
          </div>
        </div>

        <div className={Styles.inputContainer}>
          <label>0.5 - 0.25 мм:</label>
          <div className={Styles.inputWrapper}>
            {" "}
            <input
              type="number"
              value={sieveWash.f05_025 ?? ""}
              className={errors.f05_025 ? Styles.inputError : ""}
              onChange={(e) => {
                handleSieveWashChange("f05_025", e.target.value);
                if (errors.f05_025) setErrors({ ...errors, f05_025: null });
              }}
              placeholder="Введите значение"
            />
            {errors.f05_025 && (
              <span className={Styles.errorText}>{errors.f05_025}</span>
            )}
          </div>
        </div>

        <div className={Styles.inputContainer}>
          <label>0.25 - 0.1 мм:</label>
          <div className={Styles.inputWrapper}>
            <input
              type="number"
              value={sieveWash.f025_01 ?? ""}
              className={errors.f025_01 ? Styles.inputError : ""}
              onChange={(e) => {
                handleSieveWashChange("f025_01", e.target.value);
                if (errors.f025_01) setErrors({ ...errors, f025_01: null });
              }}
              placeholder="Введите значение"
            />
            {errors.f025_01 && (
              <span className={Styles.errorText}>{errors.f025_01}</span>
            )}
          </div>
        </div>

        {/* Секция 3: Окончательный отсчет по ареометру */}
        <h3 className={Styles.sectionTitle}>
          3. Окончательный отсчет по ареометру
        </h3>
        {measurements.map((m, i) => (
          <div className={Styles.inputContainer} key={i}>
            <label>{m.time}:</label>
            <div className={Styles.inputWrapper}>
              {" "}
              <input
                type="number"
                value={m.value ?? ""}
                className={errors[`measurement_${i}`] ? Styles.inputError : ""}
                onChange={(e) => {
                  handleValueChange(i, e.target.value);
                  if (errors[`measurement_${i}`]) {
                    setErrors({ ...errors, [`measurement_${i}`]: null });
                  }
                }}
                placeholder="Введите значение"
              />
              {errors[`measurement_${i}`] && (
                <span className={Styles.errorText}>
                  {errors[`measurement_${i}`]}
                </span>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={handleDownloadClick}
          className={Styles.button}
          style={{ marginTop: "20px" }}
        >
          Создать отчет
        </button>
      </div>
    </div>
  );
}
