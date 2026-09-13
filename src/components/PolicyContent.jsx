import { LegalDocument } from "./LegalDocument";
import { POLICY_DATE, POLICY_SECTIONS } from "../data/policy";

export function PolicyContent() {
  return <LegalDocument title="Политика в отношении обработки персональных данных" date={POLICY_DATE} sections={POLICY_SECTIONS} />;
}
