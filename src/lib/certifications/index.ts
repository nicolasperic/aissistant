import type { CertDefinition, ProviderDefinition } from "./types";
import adobeCommerce from "./adobe-commerce";

// ─── Provider Registry ──────────────────────────────────────────────────────
// To add a new provider, import it and add to this array.
// Example: import hyva from "./hyva";

const providers: ProviderDefinition[] = [
  adobeCommerce,
  // hyva,
];

// ─── Exports ─────────────────────────────────────────────────────────────────

export const allProviders = providers;

export const allCertifications: CertDefinition[] = providers.flatMap(
  (p) => p.certifications
);

export function getCertByCode(code: string): CertDefinition | undefined {
  return allCertifications.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
}

export function getCertById(id: string): CertDefinition | undefined {
  return allCertifications.find((c) => c.id === id);
}

export function getCertsByProvider(providerId: string): CertDefinition[] {
  return (
    providers.find((p) => p.id === providerId)?.certifications ?? []
  );
}

export function getProvider(providerId: string): ProviderDefinition | undefined {
  return providers.find((p) => p.id === providerId);
}

export type { CertDefinition, ProviderDefinition, CertSection, CertLevel } from "./types";
