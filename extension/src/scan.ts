import type { Finding, ScanResponse } from "./types";

export interface WasmScanner {
  detect_pii(input: string, categories: number): Uint32Array;
  sanitize_secrets(input: string, categories: number): string;
  sanitize_pii(input: string, categories: number, pseudonymize: boolean): string;
}

export const ALL_PII_CATEGORIES = 63;
export const ALL_SECRET_CATEGORIES = 255;

const PII_KINDS = [
  { category: 1, kind: "IP address" },
  { category: 2, kind: "Email" },
  { category: 4, kind: "Phone number" },
  { category: 8, kind: "Payment card" },
  { category: 16, kind: "Aadhaar" },
  { category: 32, kind: "PAN" },
] as const;

const SECRET_MARKERS = [
  { placeholder: "[REDACTED_API_KEY]", kind: "API key" },
  { placeholder: "[REDACTED_AUTH]", kind: "Authorization header" },
  { placeholder: "[REDACTED_COOKIE]", kind: "Cookie" },
  { placeholder: "[REDACTED_DATABASE]", kind: "Database URL" },
  { placeholder: "[REDACTED_CRYPTO_KEY]", kind: "Cryptographic key" },
  { placeholder: "[REDACTED_PASSWORD]", kind: "Password" },
  { placeholder: "[REDACTED_TOKEN]", kind: "Token" },
  { placeholder: "[REDACTED_SIGNED_URL]", kind: "Signed URL" },
] as const;

export function scanText(engine: WasmScanner, text: string): ScanResponse {
  const scrubbedSecrets = engine.sanitize_secrets(text, ALL_SECRET_CATEGORIES);
  const piiTriples = engine.detect_pii(scrubbedSecrets, ALL_PII_CATEGORIES);
  const scrubbedText = engine.sanitize_pii(scrubbedSecrets, ALL_PII_CATEGORIES, false);
  const findings = [
    ...aggregateSecretFindings(text, scrubbedSecrets),
    ...aggregatePiiFindings(piiTriples),
  ];

  return {
    ok: true,
    clean: findings.length === 0 && scrubbedText === text,
    findings,
    scrubbedText,
  };
}

export function aggregateSecretFindings(original: string, scrubbed: string): Finding[] {
  const findings: Finding[] = [];

  for (const { placeholder, kind } of SECRET_MARKERS) {
    const added = countOccurrences(scrubbed, placeholder) - countOccurrences(original, placeholder);
    if (added > 0) {
      findings.push({ kind, count: added });
    }
  }

  return findings;
}

export function aggregatePiiFindings(triples: ArrayLike<number>): Finding[] {
  const counts = new Map<number, number>();

  for (let index = 0; index + 2 < triples.length; index += 3) {
    const category = triples[index];
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const findings: Finding[] = [];
  for (const { category, kind } of PII_KINDS) {
    const count = counts.get(category);
    if (count !== undefined) {
      findings.push({ kind, count });
    }
  }

  return findings;
}

function countOccurrences(input: string, needle: string): number {
  let count = 0;
  let offset = 0;

  while (true) {
    const found = input.indexOf(needle, offset);
    if (found === -1) return count;
    count += 1;
    offset = found + needle.length;
  }
}
