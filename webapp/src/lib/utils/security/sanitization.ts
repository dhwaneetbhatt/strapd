import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const SANITIZATION_CATEGORIES = Object.freeze([
  { id: "apiKeys", label: "API keys", bit: 1 },
  { id: "auth", label: "Authorization", bit: 2 },
  { id: "cookies", label: "Cookies", bit: 4 },
  { id: "databases", label: "Databases", bit: 8 },
  { id: "cryptoKeys", label: "Cryptographic keys", bit: 16 },
  { id: "passwords", label: "Passwords", bit: 32 },
  { id: "tokens", label: "Tokens", bit: 64 },
  { id: "signedUrls", label: "Signed URLs", bit: 128 },
] as const);

export type SanitizationCategoryId =
  (typeof SANITIZATION_CATEGORIES)[number]["id"];

export const DEFAULT_SANITIZATION_CATEGORIES = Object.freeze(
  Object.fromEntries(
    SANITIZATION_CATEGORIES.map(({ id }) => [id, true]),
  ) as Record<SanitizationCategoryId, boolean>,
);

export const sanitizationCategoryMask = (
  enabled: Partial<Record<SanitizationCategoryId, boolean>>,
): number =>
  SANITIZATION_CATEGORIES.reduce(
    (mask, category) =>
      enabled[category.id] === false ? mask : mask | category.bit,
    0,
  );

export const sanitizeSecrets = (
  input: string,
  categories: Partial<Record<SanitizationCategoryId, boolean>>,
): ToolResult =>
  wasmWrapper.sanitize_secrets(input, sanitizationCategoryMask(categories));
