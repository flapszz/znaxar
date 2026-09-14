// Без сервер-рендеринга (SPA) единственный способ управлять title/description/OG/
// разметкой по странице — менять их в DOM после монтирования компонента. Гуглу
// этого достаточно (он рендерит JS), а вот превью в мессенджерах и соцсетях
// (которые JS не выполняют) сработает только для главной страницы — это
// ограничение архитектуры без SSR, отдельная большая тема, если понадобится позже.
export const DEFAULT_DESCRIPTION =
  "Знахарь — витрина БАДов со своего склада. Оставьте заявку, мы перезвоним и отправим заказ в ваш пункт выдачи. Оплата при получении.";

// selector вида meta[name="description"] или meta[property="og:title"]
function setMeta(selector, attr, value) {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    const m = /meta\[(name|property)="(.+?)"\]/.exec(selector);
    if (m) tag.setAttribute(m[1], m[2]);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

// Один вызов на страницу — title, description, OG-теги и canonical разом.
export function setSeo({ title, description, path }) {
  const fullTitle = title ? `${title} — Знахарь` : "Знахарь";
  const desc = (description || DEFAULT_DESCRIPTION).slice(0, 300);
  document.title = fullTitle;
  setMeta('meta[name="description"]', "content", desc);
  setMeta('meta[property="og:title"]', "content", fullTitle);
  setMeta('meta[property="og:description"]', "content", desc);
  if (path) {
    const url = new URL(path, window.location.origin).href;
    setMeta('meta[property="og:url"]', "content", url);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }
}

const JSONLD_ID = "product-jsonld";

export function setProductJsonLd(product) {
  let script = document.getElementById(JSONLD_ID);
  if (!product) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = JSONLD_ID;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  });
}
