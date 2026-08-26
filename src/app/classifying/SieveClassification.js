import React, { useState } from "react";
import styles from "./page.module.css";

const SieveClassification = () => {
  const [values, setValues] = useState({
    a: "",
    b: "",
    c: "",
    d: "",
    e: "",
  });

  return (
    <div>
      <div>SieveClassification</div>
      <div className={styles.container}>
        <input name="a" value={values.a} placeholder="0.075mm" />
        <input name="b" value={values.b} placeholder="Cu" />
        <input name="c" value={values.c} placeholder="Cc" />
        <input name="d" value={values.d} placeholder="0.075mm" />
        <input name="e" value={values.e} placeholder="0.075mm" />
      </div>
    </div>
  );
};

export default SieveClassification;
