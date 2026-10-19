import { useEffect } from "react";
import { C, RADIUS } from "../constants/theme";

// Короткое подтверждение внизу экрана: «Сохранено», «Заявка подтверждена». Исчезает само.
export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="anim-slide-up fixed left-1/2 -translate-x-1/2 px-5 py-3 z-50 flex items-center gap-3"
      style={{ bottom: "max(24px, env(safe-area-inset-bottom))", background: C.ink, color: C.surface, borderRadius: RADIUS.pill, fontSize: 14, maxWidth: "calc(100vw - 32px)" }}
    >
      <span aria-hidden="true" style={{ color: C.acid, fontWeight: 700 }}>✓</span>
      {message}
    </div>
  );
}
