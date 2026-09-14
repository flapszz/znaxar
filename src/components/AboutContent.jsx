import { LegalDocument } from "./LegalDocument";
import { ABOUT_SECTIONS } from "../data/about";

export function AboutContent() {
  return (
    <LegalDocument
      title="О нас"
      sections={ABOUT_SECTIONS}
      draftWarning="Черновик текста — стоит дополнить реальными фактами о работе магазина перед публикацией."
    />
  );
}
