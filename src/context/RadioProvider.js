"use client";

import { createContext, useContext, useRef, useState, useEffect } from "react";

const RadioContext = createContext();

export const RadioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // грузим станции один раз
  useEffect(() => {
    fetch(
      "https://de1.api.radio-browser.info/json/stations/bycountry/Kazakhstan?limit=50"
    )
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((station) => station.url_resolved);
        setStations(filtered);
      })
      .catch((err) => console.error("Radio API error:", err));
  }, []);

  const handlePlayPause = (stationUrl) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentStation === stationUrl && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentStation !== stationUrl) {
        audio.pause();
        audio.currentTime = 0; // сбросить прошлую станцию
      }

      setCurrentStation(stationUrl);
      audio.src = stationUrl;
      audio.load(); // гарантируем перезапуск
      audio.play().catch((err) => console.log("Play error:", err));
      setIsPlaying(true);
    }
  };

  return (
    <RadioContext.Provider
      value={{ stations, currentStation, isPlaying, handlePlayPause }}
    >
      {children}
      <audio ref={audioRef} style={{ display: "none" }} />
    </RadioContext.Provider>
  );
};

export const useRadio = () => useContext(RadioContext);
