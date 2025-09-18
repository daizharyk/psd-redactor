"use client";

import { useRadio } from "@/context/RadioProvider";
import styles from "./RadioList.module.css";

export default function RadioList({ className }) {
  const { stations, currentStation, isPlaying, handlePlayPause } = useRadio();

  return (
    <div className={`${styles.radio} ${className}`}>
      <h2 className={styles.h2}>Radio</h2>
      <div className={styles.radioContainer}>
        {stations.map((station) => (
          <div
            key={station.stationuuid}
            className={styles.radioItem}
            onClick={() => handlePlayPause(station.url_resolved)}
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
              onClick={(e) => {
                e.stopPropagation(); // чтобы клик по div не дублировал
                handlePlayPause(station.url_resolved);
              }}
            >
              {currentStation === station.url_resolved && isPlaying
                ? "⏸️"
                : "▶️"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
