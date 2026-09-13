import { LegalDocument } from "./LegalDocument";
import { OFFER_DATE, OFFER_SECTIONS } from "../data/offer";

export function OfferContent() {
  return <LegalDocument title="Оплата, доставка и возврат" date={OFFER_DATE} sections={OFFER_SECTIONS} />;
}
