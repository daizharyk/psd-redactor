import React from "react";
import styles from "./page.module.css";
import Link from "next/link";

const page = () => {
  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Link className={styles.button} href="/psd">
          PSD Process
        </Link>
        <Link className={styles.button} href="/psd-generator">
          PSD Generator
        </Link>
        <Link className={styles.button} href="/protocol">
          Сreate a protocol
        </Link>
        <Link className={styles.button} href="/psd-to-rus">
          PSD to RUS
        </Link>
        <Link className={styles.button} href="/att-to-rus">
          ATT to RUS
        </Link>
      </div>
    </div>
  );
};

export default page;
