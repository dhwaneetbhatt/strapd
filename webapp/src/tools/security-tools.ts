// Security tools definitions

import { lazy } from "react";
import { HashToolComponent, HmacToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { createPipeToolContract } from "../lib/pipes/tool-contract";
import {
  type DecodedJwt,
  type JwtAlgorithm,
  jwtOperations,
} from "../lib/utils/jwt";
import { securityUtils } from "../lib/utils/security";
import type { Tool, ToolGroup } from "../types";

// Type definition for hash tool result
type HashResult = {
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha512?: string;
};

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

const DEFAULT_HASH_ALGORITHM: HashAlgorithm = "MD5";

// Define hash tool
const hashToolDefinition: ToolDefinition<HashResult> = {
  id: "security-hash",
  name: "Hash Generator",
  description: "Generate MD5, SHA1, SHA256, SHA512",
  category: "security",
  aliases: ["hash", "md5", "sha1", "sha256", "sha512", "checksum"],
  pipe: createPipeToolContract({
    input: { kind: "transform", key: "text" },
    config: [
      {
        id: "algorithm",
        name: "Algorithm",
        type: "select",
        defaultValue: DEFAULT_HASH_ALGORITHM,
        description: "Hash algorithm applied to the incoming value",
        options: ["MD5", "SHA-1", "SHA-256", "SHA-512"],
      },
    ],
  }),
  component: HashToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");

    // If input is empty, return empty hashes
    if (!text) {
      return {
        success: true,
        md5: "",
        sha1: "",
        sha256: "",
        sha512: "",
        result: "",
      };
    }

    const md5Result = securityUtils.hash.md5(text);
    const sha1Result = securityUtils.hash.sha1(text);
    const sha256Result = securityUtils.hash.sha256(text);
    const sha512Result = securityUtils.hash.sha512(text);
    const algorithm = String(inputs.algorithm ?? DEFAULT_HASH_ALGORITHM);

    // Check if any operation failed
    if (
      !md5Result.success ||
      !sha1Result.success ||
      !sha256Result.success ||
      !sha512Result.success
    ) {
      return {
        success: false,
        error: "Failed to generate hashes",
      };
    }

    const result =
      algorithm === "SHA-1"
        ? sha1Result.result
        : algorithm === "SHA-256"
          ? sha256Result.result
          : algorithm === "SHA-512"
            ? sha512Result.result
            : md5Result.result;

    return {
      success: true,
      md5: md5Result.result,
      sha1: sha1Result.result,
      sha256: sha256Result.result,
      sha512: sha512Result.result,
      result,
    };
  },
};

// Type definition for hmac tool result
type HmacResult = {
  sha256?: string;
  sha512?: string;
};

type HmacAlgorithm = "SHA-256" | "SHA-512";

const DEFAULT_HMAC_ALGORITHM: HmacAlgorithm = "SHA-256";

const JwtInspectorToolComponent = lazy(() =>
  import("../components/tools/security/jwt-inspector-tool").then((module) => ({
    default: module.JwtInspectorToolComponent,
  })),
);

const JwtSignerToolComponent = lazy(() =>
  import("../components/tools/security/jwt-signer-tool").then((module) => ({
    default: module.JwtSignerToolComponent,
  })),
);

type JwtInspectorResult = {
  decoded?: DecodedJwt;
  verificationStatus?: "UNVERIFIED" | "VERIFIED" | "MISMATCH";
  verificationAlgorithm?: JwtAlgorithm;
  verificationError?: string;
};

const jwtInspectorToolDefinition: ToolDefinition<JwtInspectorResult> = {
  id: "security-jwt-decode",
  name: "JWT Inspector",
  description: "Decode, inspect, and verify HMAC JWTs locally",
  category: "security",
  aliases: ["jwt", "token", "decode jwt", "verify jwt", "claims"],
  scrollMode: "page",
  sensitiveInputs: ["secret"],
  pipe: createPipeToolContract({
    input: { kind: "transform", key: "token" },
    config: [
      {
        id: "outputMode",
        name: "Output",
        type: "select",
        defaultValue: "Payload",
        description: "Decoded JSON emitted by this step",
        options: ["Payload", "Header", "Full"],
      },
      {
        id: "autoStripBearer",
        name: "Accept Bearer prefix",
        type: "boolean",
        defaultValue: true,
        description: "Accept copied Authorization and Bearer values",
      },
      {
        id: "includeAnalysis",
        name: "Include analysis",
        type: "boolean",
        defaultValue: false,
        description: "Add expiration and signature analysis to full output",
      },
    ],
  }),
  component: JwtInspectorToolComponent,
  operation: (inputs) => {
    const token = String(inputs.token ?? "");
    const outputMode = String(inputs.outputMode ?? "Full");
    const includeAnalysis = Boolean(inputs.includeAnalysis ?? true);
    const acceptsBearer = Boolean(inputs.autoStripBearer ?? true);
    const normalizedStart = token.trimStart().toLowerCase();

    if (
      !acceptsBearer &&
      (normalizedStart.startsWith("bearer") ||
        normalizedStart.startsWith("authorization:"))
    ) {
      return {
        success: false,
        error: "Bearer prefix handling is disabled for this pipe step",
      };
    }

    if (outputMode === "Header") return jwtOperations.header(token);
    if (outputMode === "Payload") return jwtOperations.payload(token);

    const decoded = jwtOperations.decode(token, includeAnalysis);
    if (!decoded.success || !decoded.value) return decoded;

    const secret = String(inputs.secret ?? "");
    if (!secret) {
      return {
        success: true,
        result: decoded.result,
        decoded: decoded.value,
        verificationStatus: "UNVERIFIED",
      };
    }

    const verification = jwtOperations.verify(token, secret);
    return {
      success: true,
      result: decoded.result,
      decoded: decoded.value,
      verificationStatus: verification.success ? "VERIFIED" : "MISMATCH",
      verificationAlgorithm: verification.value?.algorithm,
      verificationError: verification.error,
    };
  },
};

const jwtSignerToolDefinition: ToolDefinition = {
  id: "security-jwt-sign",
  name: "JWT Signer",
  description: "Sign JSON claims with HS256, HS384, or HS512 locally",
  category: "security",
  aliases: [
    "jwt sign",
    "create jwt",
    "token signer",
    "jwt encode",
    "encode jwt",
  ],
  scrollMode: "page",
  sensitiveInputs: ["secret"],
  pipe: createPipeToolContract({
    input: { kind: "transform", key: "payload" },
    config: [
      {
        id: "secret",
        name: "Secret",
        type: "string",
        defaultValue: "",
        description: "HMAC secret persisted with this pipe configuration",
        validations: [
          {
            rule: "stringLength",
            min: 1,
            message: "Secret is required",
          },
        ],
      },
      {
        id: "algorithm",
        name: "Algorithm",
        type: "select",
        defaultValue: "HS256",
        description: "HMAC algorithm written to the protected header",
        options: ["HS256", "HS384", "HS512"],
      },
      {
        id: "expiration",
        name: "Expires in seconds",
        type: "number",
        defaultValue: 0,
        description: "Zero preserves exp; a positive value adds or replaces it",
        min: 0,
        validations: [{ rule: "integer", safe: true }],
      },
    ],
  }),
  component: JwtSignerToolComponent,
  operation: (inputs) => {
    const expiration = Number(inputs.expiration ?? 0);
    return jwtOperations.sign(
      String(inputs.payload ?? ""),
      String(inputs.secret ?? ""),
      String(inputs.algorithm ?? "HS256") as JwtAlgorithm,
      expiration > 0 ? expiration : undefined,
    );
  },
};

// Define hmac tool
const hmacToolDefinition: ToolDefinition<HmacResult> = {
  id: "security-hmac",
  name: "HMAC Generator",
  description: "Generate SHA256/SHA512 HMAC signatures",
  category: "security",
  aliases: ["hmac", "mac", "auth"],
  pipe: createPipeToolContract({
    input: { kind: "transform", key: "text" },
    config: [
      {
        id: "key",
        name: "Secret key",
        type: "string",
        defaultValue: "",
        description: "Secret key used to sign the incoming value",
      },
      {
        id: "algorithm",
        name: "Algorithm",
        type: "select",
        defaultValue: DEFAULT_HMAC_ALGORITHM,
        description: "HMAC algorithm applied to the incoming value",
        options: ["SHA-256", "SHA-512"],
      },
    ],
  }),
  component: HmacToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const key = String(inputs.key || "");
    const algorithm = String(inputs.algorithm ?? DEFAULT_HMAC_ALGORITHM);

    // If input is empty, return empty hashes
    if (!text) {
      return {
        success: true,
        sha256: "",
        sha512: "",
        result: "",
      };
    }

    const sha256Result = securityUtils.hmac.sha256(text, key);
    const sha512Result = securityUtils.hmac.sha512(text, key);

    // Check if any operation failed
    if (!sha256Result.success || !sha512Result.success) {
      return {
        success: false,
        error: "Failed to generate HMACs",
      };
    }

    return {
      success: true,
      sha256: sha256Result.result,
      sha512: sha512Result.result,
      result:
        algorithm === "SHA-512" ? sha512Result.result : sha256Result.result,
    };
  },
};

// Create Tool wrapper
export const hmacTool: Tool<HmacResult> = {
  id: hmacToolDefinition.id,
  name: hmacToolDefinition.name,
  description: hmacToolDefinition.description,
  category: hmacToolDefinition.category,
  aliases: hmacToolDefinition.aliases,
  operation: (inputs) => hmacToolDefinition.operation(inputs),
};

// Create Tool wrapper
export const hashTool: Tool<HashResult> = {
  id: hashToolDefinition.id,
  name: hashToolDefinition.name,
  description: hashToolDefinition.description,
  category: hashToolDefinition.category,
  aliases: hashToolDefinition.aliases,
  operation: (inputs) => hashToolDefinition.operation(inputs),
};

export const jwtInspectorTool: Tool<JwtInspectorResult> = {
  id: jwtInspectorToolDefinition.id,
  name: jwtInspectorToolDefinition.name,
  description: jwtInspectorToolDefinition.description,
  category: jwtInspectorToolDefinition.category,
  aliases: jwtInspectorToolDefinition.aliases,
  operation: jwtInspectorToolDefinition.operation,
};

export const jwtSignerTool: Tool = {
  id: jwtSignerToolDefinition.id,
  name: jwtSignerToolDefinition.name,
  description: jwtSignerToolDefinition.description,
  category: jwtSignerToolDefinition.category,
  aliases: jwtSignerToolDefinition.aliases,
  operation: jwtSignerToolDefinition.operation,
};

// Export security tools as a group
export const securityToolsGroup: ToolGroup = {
  category: "security",
  name: "Security Tools",
  description: "Cryptographic and security utilities",
  icon: CATEGORY_ICONS.security,
  tools: [hashTool, hmacTool, jwtInspectorTool, jwtSignerTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [hashToolDefinition.id]: hashToolDefinition,
  [hmacToolDefinition.id]: hmacToolDefinition,
  [jwtInspectorToolDefinition.id]: jwtInspectorToolDefinition,
  [jwtSignerToolDefinition.id]: jwtSignerToolDefinition,
};
