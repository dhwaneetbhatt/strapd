// Security tools definitions

import { HashToolComponent, HmacToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { securityUtils } from "../lib/utils/security";
import type { Tool, ToolGroup } from "../types";

// Type definition for hash tool result
type HashResult = {
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha512?: string;
};

// Define hash tool
const hashToolDefinition: ToolDefinition<HashResult> = {
  id: "security-hash",
  name: "Hash Generator",
  description: "Generate hashes",
  category: "security",
  aliases: ["hash", "md5", "sha1", "sha256", "sha512", "checksum"],
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

    return {
      success: true,
      md5: md5Result.result,
      sha1: sha1Result.result,
      sha256: sha256Result.result,
      sha512: sha512Result.result,
      result: md5Result.result, // Default result for compatibility
    };
  },
};

// Type definition for hmac tool result
type HmacResult = {
  sha256?: string;
  sha512?: string;
};

// Define hmac tool
const hmacToolDefinition: ToolDefinition<HmacResult> = {
  id: "security-hmac",
  name: "HMAC Generator",
  description: "Generate HMACs",
  category: "security",
  aliases: ["hmac", "mac", "auth"],
  component: HmacToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const key = String(inputs.key || "");

    // If input is empty, return empty hashes
    if (!text) {
      return {
        success: true,
        sha256: "",
        sha512: "",
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

// Export security tools as a group
export const securityToolsGroup: ToolGroup = {
  category: "security",
  name: "Security Tools",
  description: "Cryptographic and security utilities",
  icon: CATEGORY_ICONS.security,
  tools: [hashTool, hmacTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [hashToolDefinition.id]: hashToolDefinition,
  [hmacToolDefinition.id]: hmacToolDefinition,
};
