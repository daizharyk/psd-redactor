import React from "react";
import styles from "./goBack.module.css";
import Link from "next/link";
const GoBack = () => {
  return (
    <div>
      <Link href="/">
        <button className={styles.back}>Go back</button>
      </Link>
    </div>
  );
};

export default GoBack;
