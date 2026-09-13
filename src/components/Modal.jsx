import { C, INK, RADIUS } from "../constants/theme";

export function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,39,82,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="p-6 w-full max-w-2xl my-8"
        style={{ background: C.surface, borderRadius: RADIUS.block, boxShadow: "0 30px 80px rgba(0,39,82,.14)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
          <button onClick={onClose} style={{ color: INK[60], fontSize: 20 }} aria-label="Закрыть">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
