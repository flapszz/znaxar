import { ShieldCheck, Truck, Wallet } from "lucide-react";
import { C, INK } from "../constants/theme";

export function TrustBadges({ hasSgr = true, compact = false }) {
  const items = [
    { Icon: Wallet, label: "Оплата при получении" },
    ...(hasSgr ? [{ Icon: ShieldCheck, label: "СГР проверен" }] : []),
    { Icon: Truck, label: "Доставка СДЭК" },
  ];

  return (
    <div className={`flex ${compact ? "gap-3" : "flex-wrap gap-4"}`}>
      {items.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5" title={label}>
          <Icon size={compact ? 14 : 16} color={C.violet} strokeWidth={1.75} />
          {!compact && <span style={{ fontSize: 10.5, color: INK[60] }}>{label}</span>}
        </div>
      ))}
    </div>
  );
}
