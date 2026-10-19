// Яндекс.Метрика. Включается, только если при сборке задан номер счётчика (переменная VITE_YM_ID);
// без него ничего не загружается. Персональные данные в Метрику не передаём: без вебвизора и без
// содержимого форм, цели отправляются без параметров.
const ID = Number(import.meta.env.VITE_YM_ID);

export function initMetrika() {
  if (!Number.isInteger(ID) || ID <= 0 || typeof window === "undefined" || window.ym) return;
  (function (m, e, t, r, i, k, a) {
    m[i] =
      m[i] ||
      function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
    m[i].l = 1 * new Date();
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  window.ym(ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
}

// Достижение цели, например «заявка отправлена»: reachGoal("order_sent").
export function reachGoal(name) {
  if (Number.isInteger(ID) && ID > 0 && typeof window !== "undefined" && window.ym) window.ym(ID, "reachGoal", name);
}
