import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const PII_CATEGORIES = Object.freeze([
  { id: "ipAddresses", label: "IP addresses", bit: 1 },
  { id: "emails", label: "Emails", bit: 2 },
  { id: "phoneNumbers", label: "Phone numbers", bit: 4 },
  { id: "paymentCards", label: "Payment cards", bit: 8 },
  { id: "aadhaar", label: "Aadhaar", bit: 16 },
  { id: "pan", label: "PAN", bit: 32 },
] as const);

export type PiiCategoryId = (typeof PII_CATEGORIES)[number]["id"];
export type PiiMode = "Mask" | "Pseudonymize";
export const DEFAULT_PII_CATEGORIES = Object.freeze(
  Object.fromEntries(PII_CATEGORIES.map(({ id }) => [id, true])) as Record<
    PiiCategoryId,
    boolean
  >,
);
export const piiCategoryMask = (
  enabled: Partial<Record<PiiCategoryId, boolean>>,
): number =>
  PII_CATEGORIES.reduce(
    (mask, { id, bit }) => (enabled[id] === false ? mask : mask | bit),
    0,
  );

export const sanitizePii = (
  input: string,
  categories: Partial<Record<PiiCategoryId, boolean>>,
  mode: PiiMode = "Mask",
): ToolResult =>
  wasmWrapper.sanitize_pii(
    input,
    piiCategoryMask(categories),
    mode === "Pseudonymize",
  );
