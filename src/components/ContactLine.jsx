import { Phone } from "lucide-react";
import { SELLER } from "../data/seller";

// Телефон и часы работы продавца. Пока в реквизитах (src/data/seller.js) они
// не заполнены — ничего не показывает, чтобы не выводить пустую заглушку.
export function ContactLine({ color = "inherit", className = "" }) {
  if (!SELLER.phone) return null;
  const href = `tel:+${SELLER.phone.replace(/\D/g, "").replace(/^8/, "7")}`;
  return (
    <div className={className} style={{ color, fontSize: 13 }}>
      <a href={href} className="inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}>
        <Phone size={14} /> {SELLER.phone}
      </a>
      {SELLER.hours && <div style={{ fontSize: 12, opacity: 0.8 }}>{SELLER.hours}</div>}
    </div>
  );
}
