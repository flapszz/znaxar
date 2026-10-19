// Генерация картинок. Если в .env есть CLOUDFLARE_* — используется Cloudflare Workers AI
// (FLUX.1 schnell, бесплатная дневная квота). Иначе — бесплатный Pollinations (без ключа, на картинке
// внизу водяной знак — скрипт обрезает нижнюю полосу). Если в .env есть FAL_KEY, можно
// взять платные модели fal.ai: --provider fal.
// Примеры:
//   node scripts/gen-image.mjs --prompt "акварельные травы на светлом фоне" --out public/img/herbs.png
//   node scripts/gen-image.mjs --model recraft --size landscape_16_9 --prompt "..." --out public/img/hero.png
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MODELS = {
  schnell: "fal-ai/flux/schnell", // быстрый и самый дешёвый — для проб
  flux: "fal-ai/flux-pro/v1.1", // качество выше, дороже
  recraft: "fal-ai/recraft-v3", // чистые иллюстрации
};

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]] : null))
    .filter(Boolean)
);

const { prompt, out = "public/img/generated.png", model = "schnell", size = "square_hd" } = args;
const provider = args.provider || (process.env.CLOUDFLARE_API_TOKEN ? "cloudflare" : "pollinations");
if (!prompt) {
  console.error('Нужен --prompt "что нарисовать". Модели: schnell | flux | recraft. Размеры: square_hd, landscape_16_9, portrait_16_9, landscape_4_3, portrait_4_3.');
  process.exit(1);
}
if (provider === "cloudflare") {
  const dims = { square_hd: [1024, 1024], landscape_16_9: [1280, 720], portrait_16_9: [720, 1280], landscape_4_3: [1152, 864], portrait_4_3: [864, 1152] }[size] || [1024, 1024];
  const model = args.cfmodel || "@cf/black-forest-labs/flux-1-schnell";
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 6 }),
      signal: AbortSignal.timeout(120_000),
    }
  );
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.result?.image) {
    console.error(`Cloudflare ответил ${r.status}:`, JSON.stringify(body.errors || body).slice(0, 300));
    process.exit(1);
  }
  // FLUX schnell отдаёт квадрат 1024×1024 — обрезаем по центру до нужного соотношения сторон.
  const raw = Buffer.from(body.result.image, "base64");
  const meta = await sharp(raw).metadata();
  const ratio = dims[0] / dims[1];
  const w = ratio >= 1 ? meta.width : Math.round(meta.height * ratio);
  const h = ratio >= 1 ? Math.round(meta.width / ratio) : meta.height;
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(raw)
    .extract({ left: Math.round((meta.width - w) / 2), top: Math.round((meta.height - h) / 2), width: w, height: h })
    .png()
    .toFile(out);
  console.log(`Готово: ${out} (Cloudflare FLUX, ${w}×${h})`);
  process.exit(0);
}
if (provider === "pollinations") {
  const dims = { square_hd: [1024, 1024], landscape_16_9: [1280, 720], portrait_16_9: [720, 1280], landscape_4_3: [1152, 864], portrait_4_3: [864, 1152] }[size] || [1024, 1024];
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${dims[0]}&height=${dims[1]}&model=flux&nologo=true&seed=${Date.now() % 100000}`;
  // Бесплатный сервис иногда тормозит или рвёт соединение — пробуем до 3 раз.
  let raw;
  for (let attempt = 1; attempt <= 3 && !raw; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!r.ok) throw new Error(`ответ ${r.status}`);
      raw = Buffer.from(await r.arrayBuffer());
    } catch (e) {
      console.error(`Pollinations, попытка ${attempt}: ${e.cause?.code || e.message}`);
    }
  }
  if (!raw) {
    console.error("Pollinations не отдал картинку. Попробуйте позже.");
    process.exit(1);
  }
  const meta = await sharp(raw).metadata();
  // Нижняя полоса ~7% высоты занята водяным знаком — обрезаем.
  const cut = await sharp(raw).extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.93) }).toBuffer();
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, await sharp(cut).png().toBuffer());
  console.log(`Готово: ${out} (Pollinations, ${meta.width}×${Math.round(meta.height * 0.93)})`);
  process.exit(0);
}
if (!process.env.FAL_KEY) {
  console.error("В .env нет FAL_KEY.");
  process.exit(1);
}
const endpoint = MODELS[model] || model;

const res = await fetch(`https://fal.run/${endpoint}`, {
  method: "POST",
  headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, image_size: size, num_images: 1 }),
});
if (!res.ok) {
  console.error(`fal.ai ответил ${res.status}:`, (await res.text()).slice(0, 300));
  process.exit(1);
}
const data = await res.json();
const url = data.images?.[0]?.url;
if (!url) {
  console.error("В ответе нет картинки:", JSON.stringify(data).slice(0, 300));
  process.exit(1);
}
const img = Buffer.from(await (await fetch(url)).arrayBuffer());
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, img);
console.log(`Готово: ${out} (${Math.round(img.length / 1024)} КБ, модель ${endpoint})`);
