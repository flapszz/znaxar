// Приводит ввод к виду +7 (XXX) XXX-XX-XX по мере набора.
// Код страны (7/8) отбрасывается и подставляется заново — значащих цифр всегда максимум 10.
export function formatPhoneInput(raw) {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  if (!digits) return "";

  let out = "+7";
  out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ")";
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}

// Полный российский номер — код страны + 10 цифр.
export function isValidPhone(formatted) {
  return formatted.replace(/\D/g, "").length === 11;
}
