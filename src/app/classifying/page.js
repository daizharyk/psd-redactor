"use client";

import { useState } from "react";
import styles from "./page.module.css";
import GoBack from "@/button/goBack";
import SieveClassification from "./SieveClassification";

export default function Page() {
  const [values, setValues] = useState({
    a: "",
    b: "",
    c: "",
    d: "",
    e: "",
  });
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState("");

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleDetermine = () => {
    const LL = Number(values.a);
    const PI = Number(values.b);
    const passing200 = Number(values.c);
    const sand = Number(values.d);
    const gravel = Number(values.e);

    if ([LL, PI, passing200, sand, gravel].some(Number.isNaN)) return;

    const total = sand + gravel + passing200;
    // if (Math.abs(total - 100) > 0.5) {
    //   alert("Sand + Gravel + Passing 0.075 must be ≈ 100%");
    //   return;
    // }

    const result = classifyATT(LL, PI, passing200, sand, gravel);
    setResult(result);
  };

  const hasSieveData = values.c !== "" || values.d !== "" || values.e !== "";

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // через 1.5 секунды вернем текст обратно
  };
  function classifyATT(
    LL,
    PI,
    passing200,
    sandPercent,
    gravelPercent,
    hasSieveData
  ) {
    let soilSymbol = "";
    let soilName = "";

    // --- PLASTICITY (Base classification) ---
    if (LL < 50) {
      if (PI < 4) {
        soilSymbol = "ML";
        soilName = "silt";
      } else if (PI >= 4 && PI <= 7) {
        soilSymbol = "CL-ML";
        soilName = "silty clay";
      } else if (PI > 7) {
        soilSymbol = "CL";
        soilName = "lean clay";
      }
    } else {
      alert("LL ≥ 50 — classification not implemented yet");
      return "Not classified";
    }

    if (!hasSieveData) {
      return soilName.charAt(0).toUpperCase() + soilName.slice(1);
    }

    // --- COARSE FRACTION MODIFIERS ---
    // Percentages of coarse fraction (retained on No. 200)
    const coarseTotal = 100 - passing200;

    // If no coarse fraction, return base classification
    if (coarseTotal < 15) {
      return `${soilName.charAt(0).toUpperCase() + soilName.slice(1)} `;
    }

    // Calculate which is dominant: sand or gravel
    const sandDominant = sandPercent >= gravelPercent;

    let prefix = "";
    let suffix = "";

    if (coarseTotal >= 30) {
      // ≥ 30% plus No. 200
      if (sandPercent >= 15 && gravelPercent >= 15) {
        // Both sand and gravel significant
        if (sandDominant) {
          prefix = "Sandy";
          suffix = " with gravel";
        } else {
          prefix = "Gravelly";
          suffix = " with sand";
        }
      } else {
        // Only one is significant
        prefix = sandDominant ? "Sandy" : "Gravelly";
      }
    } else if (coarseTotal >= 15) {
      // 15-29% plus No. 200
      suffix = sandDominant ? " with sand" : " with gravel";
    }

    // Construct final name
    let finalName = prefix ? `${prefix} ${soilName}` : soilName;
    finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
    if (suffix) {
      finalName += suffix;
    }

    return `${finalName} `;
  }
  return (
    <div className={styles.wrapper}>
      <GoBack />
      <div className={styles.att}>
        <div className={styles.title}>ASTM D2487-17 Soil Classifier</div>
        <div className={styles.title}>АТТ</div>
        <div className={styles.form}>
          <input
            name="a"
            value={values.a}
            placeholder="LL %"
            onChange={handleChange}
          />
          <input
            name="b"
            value={values.b}
            placeholder="PI"
            onChange={handleChange}
          />
          <input
            name="c"
            value={values.c}
            placeholder="0.075mm"
            onChange={handleChange}
          />
          <input
            name="d"
            value={values.d}
            placeholder="Sand %"
            onChange={handleChange}
          />

          <input
            name="e"
            value={values.e}
            placeholder="Gravel %"
            onChange={handleChange}
          />

          <button onClick={handleDetermine}>Determine</button>

          <div className={styles.resultWrapper}>
            <div className={styles.result}>{result}</div>
            <button className={styles.copyButton} onClick={handleCopy}>
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.sive}>
        <SieveClassification />
      </div>
    </div>
  );
}
