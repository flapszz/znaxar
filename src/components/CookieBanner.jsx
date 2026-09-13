import { useEffect, useState } from "react";
import { C, INK, RADIUS, SHADOW_FRAME } from "../constants/theme";
import { Btn } from "./Btn";

const STORAGE_KEY = "cookie_notice_v1";

export function CookieBanner({ onVisibleChange }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage может быть недоступен (приватный режим, отключённое хранилище) — тогда просто показываем баннер каждый раз.
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // недоступно — ничего страшного, просто не запомнится в этом браузере
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 flex flex-wrap items-center justify-center gap-3 px-5 py-3 text-center"
      style={{ background: C.ink, boxShadow: SHADOW_FRAME }}
    >
      <span style={{ fontSize: 12.5, color: "rgba(251,248,243,.85)", maxWidth: 640 }}>
        Мы используем файлы cookie и сервисы веб-аналитики, чтобы сайт работал корректно и становился удобнее.
        Продолжая пользоваться сайтом, вы соглашаетесь с этим. Подробнее —{" "}
        <a href="/privacy" target="_blank" rel="noopener" className="underline" style={{ color: C.acid }}>
          в Политике конфиденциальности
        </a>
        .
      </span>
      <Btn variant="acid" onClick={accept}>
        Понятно
      </Btn>
    </div>
  );
}
