import { useRef, useState } from "react";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { ProductPhoto } from "../components/ProductPhoto";
import { C, HEAD, INK, OVERLINE, RADIUS, inputStyle } from "../constants/theme";
import { SELLER } from "../data/seller";
import { money } from "../utils/format";
import { formatPhoneInput, isValidPhone } from "../utils/phone";

export function Checkout({ cart, bySku, setQty, total, onBack, onSubmit }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", comment: "" });
  const [consent, setConsent] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const consentRef = useRef(null);
  const phoneOk = isValidPhone(form.phone);
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updPhone = (e) => setForm({ ...form, phone: formatPhoneInput(e.target.value) });

  const handleSubmit = async () => {
    if (submitting) return;
    setAttempted(true);

    if (!consent) {
      setConsentError(true);
      consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      consentRef.current?.focus();
      return;
    }
    setConsentError(false);
    if (!form.name.trim() || !phoneOk || !form.city.trim()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      // honeypot: обычные посетители это поле не видят и не трогают — если оно заполнено,
      // сервер молча отбросит заявку, приняв её как ответ бота.
      await onSubmit({ ...form, consentGiven: true, website: "" });
    } catch (err) {
      setSubmitError(err.message || "Не удалось отправить заявку. Попробуйте ещё раз.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="mb-5" style={{ fontSize: 13, color: INK[60] }}>
          ← Ко всем товарам
        </button>
      )}

      <div className="flex gap-8 flex-wrap">
        <div style={{ flex: "2 1 380px", minWidth: 0 }}>
          <h1 style={{ ...HEAD, fontSize: "clamp(24px,4vw,30px)", color: C.ink }}>Заявка</h1>
          <p className="mt-1 mb-6" style={{ fontSize: 14, color: INK[60] }}>
            Оставьте контакты — перезвоним, подтвердим наличие и договоримся о доставке.
          </p>

          {/* honeypot: скрыто от людей стилями, но видно ботам, которые слепо заполняют все поля формы */}
          <input
            type="text"
            name="website"
            value={form.website || ""}
            onChange={upd("website")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />

          <Field label="Имя">
            <input value={form.name} onChange={upd("name")} className="w-full px-4 py-2.5" style={inputStyle} />
            {attempted && !form.name.trim() && (
              <span className="block mt-1" style={{ fontSize: 12, color: C.danger }}>
                Укажите имя.
              </span>
            )}
          </Field>
          <Field label="Телефон">
            <input
              value={form.phone}
              onChange={updPhone}
              type="tel"
              placeholder="+7 (___) ___-__-__"
              className="w-full px-4 py-2.5"
              style={inputStyle}
            />
            {((form.phone && !phoneOk) || (attempted && !form.phone)) && (
              <span className="block mt-1" style={{ fontSize: 12, color: C.danger }}>
                Введите номер полностью.
              </span>
            )}
          </Field>
          <Field label="Город" hint="Пункт выдачи выберем на звонке. Позже здесь встанет карта СДЭК.">
            <input value={form.city} onChange={upd("city")} className="w-full px-4 py-2.5" style={inputStyle} />
            {attempted && !form.city.trim() && (
              <span className="block mt-1" style={{ fontSize: 12, color: C.danger }}>
                Укажите город.
              </span>
            )}
          </Field>
          <Field label="Комментарий">
            <textarea
              value={form.comment}
              onChange={upd("comment")}
              rows={2}
              className="w-full px-4 py-2.5"
              style={{ ...inputStyle, borderRadius: RADIUS.block }}
            />
          </Field>

          <label
            className="flex items-start gap-2.5 mb-1 py-1"
            style={{ fontSize: 13, color: C.ink, cursor: "pointer" }}
          >
            <input
              ref={consentRef}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              style={{ width: 20, height: 20, minWidth: 20, marginTop: 1 }}
            />
            <span style={{ color: INK[72] }}>
              Я даю согласие ИП {SELLER.fullName || "[ФИО ИП]"} на обработку моих персональных данных (имя, номер
              телефона) в целях обработки заявки и связи со мной по телефону — на условиях{" "}
              <a href="/consent" target="_blank" rel="noopener" className="underline" style={{ color: C.violet }}>
                Согласия
              </a>{" "}
              и{" "}
              <a href="/privacy" target="_blank" rel="noopener" className="underline" style={{ color: C.violet }}>
                Политики конфиденциальности
              </a>
              .
            </span>
          </label>
          {consentError && (
            <p className="mb-4" style={{ fontSize: 12, color: C.danger }}>
              Без согласия мы не сможем вам перезвонить.
            </p>
          )}

          {submitError && (
            <p className="mt-4 mb-3" style={{ fontSize: 12, color: C.danger }}>
              {submitError}
            </p>
          )}

          <div className="mt-4">
            <Btn variant="acid" full disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Отправляем…" : "Отправить заявку"}
            </Btn>
          </div>

          <p className="mt-3" style={{ fontSize: 11, color: INK[60] }}>
            Оформляя заявку, вы принимаете условия{" "}
            <a href="/terms" target="_blank" rel="noopener" className="underline" style={{ color: INK[60] }}>
              оплаты, доставки и возврата
            </a>
            .
          </p>
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div className="p-5" style={{ background: C.ink, borderRadius: RADIUS.card, color: C.surface }}>
            <div style={{ ...OVERLINE, color: "rgba(251,248,243,.5)" }}>Ваша заявка</div>
            <div className="mt-3">
              {cart.map((i) => {
                const p = bySku[i.sku];
                return (
                  <div key={i.sku} className="flex items-center gap-3 py-2.5" style={{ borderTop: `1px solid rgba(251,248,243,.12)` }}>
                    <div className="w-12 shrink-0">
                      <ProductPhoto sku={p.sku} imageUrl={p.imageUrl} alt={p.title} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(251,248,243,.6)" }}>{money(p.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(i.sku, i.qty - 1)} style={{ color: "rgba(251,248,243,.7)", padding: "0 4px" }}>
                        −
                      </button>
                      <span style={{ fontSize: 13 }}>{i.qty}</span>
                      <button
                        onClick={() => setQty(i.sku, Math.min(i.qty + 1, p.stock))}
                        style={{ color: "rgba(251,248,243,.7)", padding: "0 4px" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between pt-3 mt-1" style={{ borderTop: "2px solid rgba(251,248,243,.3)", fontWeight: 700 }}>
              <span style={{ fontSize: 15 }}>Итого</span>
              <span style={{ fontSize: 20, whiteSpace: "nowrap" }}>{money(total)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2" style={{ fontSize: 12.5, color: INK[60] }}>
            <div>1 · Перезвоним в рабочее время</div>
            <div>2 · Подтвердим наличие и пункт выдачи</div>
            <div>3 · Отправим и пришлём трек-номер</div>
          </div>
        </div>
      </div>
    </div>
  );
}
