import { useEffect, useState } from "react";
import { C, HEAD, INK } from "../constants/theme";

function versionToDate(version) {
  const m = /consent-(\d{4})-(\d{2})-(\d{2})/.exec(version || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

export function ConsentContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/legal/consent")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Не удалось загрузить текст согласия."));
  }, []);

  if (error) {
    return <p style={{ fontSize: 13, color: C.danger }}>{error}</p>;
  }
  if (!data) {
    return <p style={{ fontSize: 13, color: INK[60] }}>Загружаем…</p>;
  }

  return (
    <div>
      <h2 style={{ ...HEAD, fontSize: 22, color: C.ink }}>Согласие на обработку персональных данных</h2>
      <p className="mt-1" style={{ fontSize: 12, color: INK[60] }}>
        Редакция от {versionToDate(data.version)}
      </p>
      <p className="mt-4" style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>
        {data.text}
      </p>
    </div>
  );
}
