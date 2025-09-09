import { useEffect, useState } from "react";

export default function RadioPlayer() {
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);

  useEffect(() => {
    fetch("https://de1.api.radio-browser.info/json/stations/bycountry/Kazakhstan")
      .then((response) => response.json())
      .then((data) => setStations(data))
      .catch((error) => console.error("Ошибка при получении данных:", error));
  }, []);

  const handlePlay = (url) => {
    setCurrentStation(url);
  };

  return (
    <div>
      <h2>Казахстанские радиостанции</h2>
      <div>
        {stations.map((station) => (
          <div key={station.id}>
            <img src={station.favicon} alt={station.name} width={50} height={50} />
            <span>{station.name}</span>
            <button onClick={() => handlePlay(station.url)}>Play</button>
          </div>
        ))}
      </div>
      {currentStation && (
        <audio controls autoPlay>
          <source src={currentStation} type="audio/mpeg" />
          Ваш браузер не поддерживает элемент audio.
        </audio>
      )}
    </div>
  );
}
