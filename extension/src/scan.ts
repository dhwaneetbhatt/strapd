import { normalizeDetectors } from "./storage";
import type { DetectorSettings, Finding, ScanResponse } from "./types";

export interface WasmScanner {
  detect_pii(input: string, categories: number): Uint32Array;
  sanitize_secrets(input: string, categories: number): string;
  sanitize_pii(input: string, categories: number, pseudonymize: boolean): string;
}

export const ALL_PII_CATEGORIES = 63;
export const ALL_SECRET_CATEGORIES = 255;

const EMPTY_TRIPLES = new Uint32Array(0);

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

export function detectorBits(detectors?: DetectorSettings): { secrets: number; pii: number } {
  const settings = normalizeDetectors(detectors);
  let secrets = 0;
  let pii = 0;

  if (settings.apiKey) {
    secrets |= 1 | 2 | 4 | 8 | 16 | 32 | 128;
  }
  if (settings.jwt) {
    secrets |= 64;
  }
  if (settings.ip) {
    pii |= 1;
  }
  if (settings.email) {
    pii |= 2 | 4 | 8 | 16 | 32;
  }

  return { secrets, pii };
}

export function scanText(
  engine: WasmScanner,
  text: string,
  detectors?: DetectorSettings,
): ScanResponse {
  const started = performance.now();
  const bits = detectorBits(detectors);
  const scrubbedSecrets = bits.secrets === 0 ? text : engine.sanitize_secrets(text, bits.secrets);
  const piiTriples = bits.pii === 0
    ? EMPTY_TRIPLES
    : engine.detect_pii(scrubbedSecrets, bits.pii);
  const scrubbedText = bits.pii === 0
    ? scrubbedSecrets
    : engine.sanitize_pii(scrubbedSecrets, bits.pii, false);

  const findings = [
    ...(bits.secrets === 0 ? [] : aggregateSecretFindings(text, scrubbedSecrets)),
    ...(bits.pii === 0 ? [] : aggregatePiiFindings(piiTriples)),
  ];

  return {
    ok: true,
    clean: findings.length === 0 && scrubbedText === text,
    findings,
    scrubbedText,
    elapsedMs: Math.max(0, performance.now() - started),
  };
}

export function countFindings(findings: Finding[]): number {
  return findings.reduce((total, finding) => total + finding.count, 0);
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
